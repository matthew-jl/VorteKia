use anyhow::Result;
use controllers::chat_handler::{ChatHandler, ChatWithCustomerName, MessageWithSenderName};
use controllers::lost_and_found_items_log_handler::LostAndFoundItemsLogHandler;
use controllers::maintenance_schedule_handler::MaintenanceScheduleHandler;
use deadpool_redis::{redis::cmd, Config as RedisConfig, Pool as RedisPool, Runtime};
use dotenv::dotenv;
use sea_orm::{Database, DatabaseConnection};
use serde::{Deserialize, Serialize};
use std::env;
use std::{fs::File, io::Read};
use tauri::{Emitter, Manager, State};

use controllers::souvenir_handler::SouvenirHandler;
use controllers::order_restaurant_handler::OrderRestaurantHandler;
use controllers::order_souvenir_handler::OrderSouvenirHandler;
use controllers::store_handler::StoreHandler;
use controllers::customer_handler::CustomerHandler;
use controllers::staff_handler::StaffHandler;
use controllers::menu_item_handler::MenuItemHandler;
use controllers::restaurant_handler::RestaurantHandler;
use controllers::ride_handler::RideHandler;
use controllers::ride_queue_handler::RideQueueHandler;
pub mod controllers;


#[derive(Serialize, Deserialize)]
struct Config {
    chosen_ui: UiConfig,
}

#[derive(Serialize, Deserialize)]
struct UiConfig {
    ui_id: String,
}

pub struct AppState {
    db: DatabaseConnection,
    redis_pool: RedisPool,
}

#[derive(Serialize)]
#[serde(tag = "status", rename_all = "lowercase")]
pub enum ApiResponse<T: Serialize> {
    Success { data: T, message: Option<String> },
    Error { data: Option<T>, message: String },
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse::Success {
            data,
            message: None,
        }
    }

    pub fn error(message: String) -> Self {
        ApiResponse::Error {
            data: None,
            message,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct CachedData<T> {
    data: T,
}

pub async fn cache_set<T: Serialize>(pool: &RedisPool, key: &str, value: &T, ttl: usize) {
    let mut conn = match pool.get().await {
        Ok(conn) => conn,
        Err(err) => {
            eprintln!("Redis error (cache_set - get connection): {}", err);
            return; // ✅ Silently fail, don't stop execution
        }
    };

    let json_value = match serde_json::to_string(&CachedData { data: value }) {
        Ok(json) => json,
        Err(err) => {
            eprintln!("Redis error (cache_set - serialization): {}", err);
            return;
        }
    };

    if let Err(err) = cmd("SETEX")
        .arg(&[key, &ttl.to_string(), &json_value])
        .query_async::<()>(&mut conn)
        .await
    {
        eprintln!("Redis error (cache_set - SETEX): {}", err);
    }
}

pub async fn cache_delete(pool: &RedisPool, key: &str) {
    let mut conn = match pool.get().await {
        Ok(conn) => conn,
        Err(err) => {
            eprintln!("Redis error (cache_delete - get connection): {}", err);
            return;
        }
    };

    if let Err(err) = cmd("DEL").arg(&[key]).query_async::<()>(&mut conn).await {
        eprintln!("Redis error (cache_delete - DEL): {}", err);
    }
}

pub async fn cache_get<T: for<'de> Deserialize<'de>>(pool: &RedisPool, key: &str) -> Option<T> {
    let mut conn = match pool.get().await {
        Ok(conn) => conn,
        Err(err) => {
            eprintln!("Redis error (cache_get - get connection): {}", err);
            return None; // ✅ Silently fail
        }
    };

    let cached_data: Option<String> = match cmd("GET").arg(&[key]).query_async(&mut conn).await {
        Ok(value) => value,
        Err(err) => {
            eprintln!("Redis error (cache_get - GET): {}", err);
            return None;
        }
    };

    if let Some(json_str) = cached_data {
        match serde_json::from_str::<CachedData<T>>(&json_str) {
            Ok(wrapper) => Some(wrapper.data),
            Err(err) => {
                eprintln!("Redis error (cache_get - deserialization): {}", err);
                None
            }
        }
    } else {
        None
    }
}

fn load_config() -> Result<Config, Box<dyn std::error::Error>> {
    println!("Current working directory: {:?}", env::current_dir()?);
    let mut file = File::open("config/config.json")?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let config: Config = serde_json::from_str(&contents)?;
    Ok(config)
}

// Mapping function to convert ui_id to ui name
fn map_ui_id_to_name(ui_id: &str) -> &str {
    match ui_id {
        "RE-001" => "restaurant/643a030d-3caa-4162-8a91-54230fca568f", // Paris Bread
        "ST-RE-001" => "restaurant/643a030d-3caa-4162-8a91-54230fca568f/staff",
        "RE-002" => "restaurant/c251a835-efda-4487-b481-c655d024c85f", // The Beer Bar
        "ST-RE-002" => "restaurant/c251a835-efda-4487-b481-c655d024c85f/staff",
        "RE-003" => "restaurant/ac0e43b0-f9e1-4a31-9a5f-e33487135776", // Radiator Springs
        "ST-RE-003" => "restaurant/ac0e43b0-f9e1-4a31-9a5f-e33487135776/staff",
        "RI-000" => "ride/6f860dcf-d7e8-4a09-ad0b-4fbfa783a144", // Kora Kora (Closed)
        "ST-RI-000" => "ride/6f860dcf-d7e8-4a09-ad0b-4fbfa783a144/staff", // Kora Kora (Closed)
        "RI-001" => "ride/bf3d0465-377f-4a36-8fef-f491ddd5591a", // Vortex Odyssey
        "ST-RI-001" => "ride/bf3d0465-377f-4a36-8fef-f491ddd5591a/staff", // Vortex Odyssey
        "RI-002" => "ride/a38a0c09-f6c2-4889-8fe8-be78f2cecaf9", // Neon Battle Arena
        "ST-RI-002" => "ride/a38a0c09-f6c2-4889-8fe8-be78f2cecaf9/staff", // Neon Battle Arena
        "RI-003" => "ride/be758d9e-5273-4789-a75b-cac22e20a301", // Robo World Pavilion (Pending)
        "ST-RI-003" => "ride/be758d9e-5273-4789-a75b-cac22e20a301/staff", // Robo World Pavilion (Pending)
        "SR-001" => "store/2fb3f823-b6a2-4b97-a5de-bb03d622e2c6", // Dragon Lego
        "SR-002" => "store/d989b2aa-1ecb-4a31-a3da-6270bd64ebdc", // Pinky Power Studio
        "SR-003" => "store/34084866-0196-4ef5-9b95-9c692489deac", // Infinity Store
        "ST-001" => "staff",
        "CU-001" => "customer",
        _ => "unknown_ui", // Default case for unknown UI IDs
    }
}

// Get UI ID from config.json
#[tauri::command]
fn get_ui_name_from_config() -> String {
    let config = load_config().expect("Failed to load config");

    map_ui_id_to_name(&config.chosen_ui.ui_id).to_string()
}

// Customer login
#[tauri::command]
async fn customer_login(state: State<'_, AppState>, customer_id: String) -> Result<ApiResponse<String>, String> {
    CustomerHandler::customer_login(&state, customer_id).await
}

// Get customer details by ID
#[tauri::command]
async fn get_customer_details(
    state: State<'_, AppState>,
    customer_id: String,
) -> Result<ApiResponse<entity::customer::Model>, String> {
    CustomerHandler::get_customer_details(&state, customer_id).await
}


// View all customer accounts
#[tauri::command]
async fn view_customer_accounts(state: State<'_, AppState>) -> Result<ApiResponse<Vec<entity::customer::Model>>, String> {
    CustomerHandler::view_customer_accounts(&state).await
}

// Save (create) a new customer
#[tauri::command]
async fn save_customer_data(
    state: State<'_, AppState>,
    name: String,
    virtual_balance: String,
) -> Result<ApiResponse<String>, String> {
    CustomerHandler::save_customer_data(&state, name, virtual_balance).await
}

// Update an existing customer
#[tauri::command]
async fn update_customer_data(
    state: State<'_, AppState>,
    customer_id: String,
    name: Option<String>,
    virtual_balance: Option<String>,
) -> Result<String, String> {
    CustomerHandler::update_customer_data(&state, customer_id, name, virtual_balance).await
}

// Top up virtual balance
#[tauri::command]
async fn top_up_virtual_balance(
    state: State<'_, AppState>,
    customer_id: String,
    top_up_amount_str: String,
) -> Result<ApiResponse<String>, String> {
    CustomerHandler::top_up_virtual_balance(&state, customer_id, top_up_amount_str).await
}

// Delete a customer
#[tauri::command]
async fn delete_customer_data(
    state: State<'_, AppState>,
    customer_id: String,
) -> Result<String, String> {
    CustomerHandler::delete_customer_data(&state, customer_id).await
}

// Staff related commands
#[tauri::command]
async fn staff_login(
    state: State<'_, AppState>,
    email: String,
    password: String,
) -> Result<ApiResponse<String>, String> {
    StaffHandler::staff_login(&state, email, password).await
}

#[tauri::command]
async fn get_staff_details(
    state: State<'_, AppState>,
    staff_id: String,
) -> Result<ApiResponse<entity::staff::Model>, String> {
    StaffHandler::get_staff_details(&state, staff_id).await
}

#[tauri::command]
async fn get_staff_details_by_email(
    state: State<'_, AppState>,
    email: String, 
)-> Result<ApiResponse<entity::staff::Model>, String> {
  StaffHandler::get_staff_details_by_email(&state, email).await
}

#[tauri::command]
async fn view_staff_accounts(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<entity::staff::Model>>, String> {
    StaffHandler::view_staff_accounts(&state).await
}

#[tauri::command]
async fn view_ride_staffs( // New command
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<entity::staff::Model>>, String> {
    StaffHandler::view_ride_staffs(&state).await // Call the new handler function
}

#[tauri::command]
async fn view_maintenance_staffs(state: State<'_, AppState>,) -> Result<ApiResponse<Vec<entity::staff::Model>>, String> {
  StaffHandler::view_maintenance_staffs(&state).await
}

#[tauri::command]
async fn save_staff_data(
    state: State<'_, AppState>,
    email: String,
    password: String,
    name: String,
    role: String,
) -> Result<ApiResponse<String>, String> {
    StaffHandler::save_staff_data(&state, email, password, name, role).await
}

#[tauri::command]
async fn update_staff_data(
    state: State<'_, AppState>,
    staff_id: String,
    email: Option<String>,
    name: Option<String>,
    role: Option<String>,
) -> Result<ApiResponse<String>, String> {
    StaffHandler::update_staff_data(&state, staff_id, email, name, role).await
}

#[tauri::command]
async fn delete_staff_data(
    state: State<'_, AppState>,
    staff_id: String,
) -> Result<String, String> {
    StaffHandler::delete_staff_data(&state, staff_id).await
}

// Restaurant related commands
#[tauri::command]
async fn view_restaurants(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<entity::restaurant::Model>>, String> {
    RestaurantHandler::view_restaurants(&state).await
}

#[tauri::command]
async fn get_restaurant_details(
    state: State<'_, AppState>,
    restaurant_id: String,
) -> Result<ApiResponse<entity::restaurant::Model>, String> {
    RestaurantHandler::get_restaurant_details(&state, restaurant_id).await
}

#[tauri::command]
async fn save_restaurant_data(
    state: State<'_, AppState>,
    name: String,
    photo: Option<String>,
    opening_time: String,
    closing_time: String,
    cuisine_type: String,
    location: Option<String>,
    status: String,
) -> Result<ApiResponse<String>, String> {
    RestaurantHandler::save_restaurant_data(&state, name, photo, opening_time, closing_time, cuisine_type, location, status).await
}

#[tauri::command]
async fn update_restaurant_data(
    state: State<'_, AppState>,
    restaurant_id: String,
    name: Option<String>,
    photo: Option<Option<String>>,
    opening_time: Option<String>,
    closing_time: Option<String>,
    cuisine_type: Option<String>,
    location: Option<Option<String>>,
    status: Option<String>,
) -> Result<ApiResponse<String>, String> {
    RestaurantHandler::update_restaurant_data(&state, restaurant_id, name, photo, opening_time, closing_time, cuisine_type, location, status).await
}


#[tauri::command]
async fn delete_restaurant_data(
    state: State<'_, AppState>,
    restaurant_id: String,
) -> Result<String, String> {
    RestaurantHandler::delete_restaurant_data(&state, restaurant_id).await
}


// Menu Item related commands
#[tauri::command]
async fn view_menu_items(
    state: State<'_, AppState>,
    restaurant_id: Option<String>,
) -> Result<ApiResponse<Vec<entity::menu_item::Model>>, String> {
    MenuItemHandler::view_menu_items(&state, restaurant_id).await
}

#[tauri::command]
async fn get_menu_item_details(
    state: State<'_, AppState>,
    menu_item_id: String,
) -> Result<ApiResponse<entity::menu_item::Model>, String> {
    MenuItemHandler::get_menu_item_details(&state, menu_item_id).await
}

#[tauri::command]
async fn save_menu_item_data(
    state: State<'_, AppState>,
    photo: Option<String>,
    name: String,
    price: String,
    restaurant_id: String,
) -> Result<ApiResponse<String>, String> {
    MenuItemHandler::save_menu_item_data(&state, photo, name, price, restaurant_id).await
}

#[tauri::command]
async fn update_menu_item_data(
    state: State<'_, AppState>,
    menu_item_id: String,
    photo: Option<Option<String>>,
    name: Option<String>,
    price: Option<String>,
    restaurant_id: Option<String>,
) -> Result<ApiResponse<String>, String> {
    MenuItemHandler::update_menu_item_data(&state, menu_item_id, photo, name, price, restaurant_id).await
}

#[tauri::command]
async fn delete_menu_item_data(
    state: State<'_, AppState>,
    menu_item_id: String,
) -> Result<String, String> {
    MenuItemHandler::delete_menu_item_data(&state, menu_item_id).await
}

#[tauri::command]
async fn view_order_restaurants(
    state: tauri::State<'_, AppState>,
    restaurant_id: Option<String>,
) -> Result<ApiResponse<Vec<entity::order_restaurant::Model>>, String> {
    OrderRestaurantHandler::view_order_restaurants(&state, restaurant_id).await
}

#[tauri::command]
async fn view_order_restaurants_by_customer(
    state: tauri::State<'_, AppState>,
    customer_id: String,
    restaurant_id: String,
) -> Result<ApiResponse<Vec<entity::order_restaurant::Model>>, String> {
    OrderRestaurantHandler::view_order_restaurants_by_customer(&state, customer_id, restaurant_id).await
}

#[tauri::command]
async fn save_order_restaurant_data(
    state: tauri::State<'_, AppState>,
    customer_id: String,
    restaurant_id: String,
    menu_item_id: String,
    quantity: i32,
) -> Result<ApiResponse<String>, String> {
    OrderRestaurantHandler::save_order_restaurant_data(&state, customer_id, restaurant_id, menu_item_id, quantity).await
}

#[tauri::command]
async fn update_order_restaurant_status(
    state: tauri::State<'_, AppState>,
    order_restaurant_id: String,
    status: String,
) -> Result<ApiResponse<String>, String> {
    OrderRestaurantHandler::update_order_restaurant_status(&state, order_restaurant_id, status).await
}

#[tauri::command]
async fn delete_order_restaurant_data(
    state: tauri::State<'_, AppState>,
    order_restaurant_id: String,
) -> Result<ApiResponse<String>, String> {
    OrderRestaurantHandler::delete_order_restaurant_data(&state, order_restaurant_id).await
}

#[tauri::command]
async fn view_rides(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<entity::ride::Model>>, String> {
    RideHandler::view_rides(&state).await
}

#[tauri::command]
async fn get_ride_details(
    state: State<'_, AppState>,
    ride_id: String,
) -> Result<ApiResponse<entity::ride::Model>, String> {
    RideHandler::get_ride_details(&state, ride_id).await
}

#[tauri::command]
async fn save_ride_data(
    state: State<'_, AppState>,
    status: String,
    name: String,
    price: String,
    location: String,
    staff_id: String,
    photo: Option<String>,
) -> Result<ApiResponse<String>, String> {
    RideHandler::save_ride_data(&state, status, name, price, location, staff_id, photo).await
}

#[tauri::command]
async fn update_ride_data(
    state: State<'_, AppState>,
    ride_id: String,
    status: Option<String>,
    name: Option<String>,
    price: Option<String>,
    location: Option<String>,
    staff_id: Option<String>,
    photo: Option<Option<String>>,
) -> Result<ApiResponse<String>, String> {
    RideHandler::update_ride_data(&state, ride_id, status, name, price, location, staff_id, photo).await
}

#[tauri::command]
async fn delete_ride_data(
    state: State<'_, AppState>,
    ride_id: String,
) -> Result<String, String> {
    RideHandler::delete_ride_data(&state, ride_id).await
}

#[tauri::command]
async fn view_ride_queues(
    state: State<'_, AppState>,
    ride_id: Option<String>,
) -> Result<ApiResponse<Vec<entity::ride_queue::Model>>, String> {
    RideQueueHandler::view_ride_queues(&state, ride_id).await
}

#[tauri::command]
async fn save_ride_queue_data(
    state: State<'_, AppState>,
    ride_id: String,
    customer_id: String,
    queue_position: String,
) -> Result<ApiResponse<String>, String> {
    let position = queue_position.parse::<rust_decimal::Decimal>()
        .map_err(|e| format!("Invalid queue position: {}", e))?;
    RideQueueHandler::save_ride_queue_data(&state, ride_id, customer_id, position).await
}

#[tauri::command]
async fn update_queue_position(
    state: State<'_, AppState>,
    ride_queue_id: String,
    queue_position: String,
) -> Result<ApiResponse<String>, String> {
    let position = queue_position.parse::<rust_decimal::Decimal>()
        .map_err(|e| format!("Invalid queue position: {}", e))?;
    RideQueueHandler::update_queue_position(&state, ride_queue_id, position).await
}

#[tauri::command]
async fn delete_ride_queue_data(
    state: State<'_, AppState>,
    ride_queue_id: String,
) -> Result<String, String> {
    RideQueueHandler::delete_ride_queue_data(&state, ride_queue_id).await
}

#[tauri::command]
async fn view_stores(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<entity::store::Model>>, String> {
    StoreHandler::view_stores(&state).await
}

#[tauri::command]
async fn get_store_details(
    state: State<'_, AppState>,
    store_id: String,
) -> Result<ApiResponse<entity::store::Model>, String> {
    StoreHandler::get_store_details(&state, store_id).await
}

#[tauri::command]
async fn save_store_data(
    state: State<'_, AppState>,
    name: String,
    photo: Option<String>,
    opening_time: String,
    closing_time: String,
    location: Option<String>,
    status: String,
) -> Result<ApiResponse<String>, String> {
    StoreHandler::save_store_data(&state, name, photo, opening_time, closing_time, location, status).await
}

#[tauri::command]
async fn update_store_data(
    state: State<'_, AppState>,
    store_id: String,
    name: Option<String>,
    photo: Option<Option<String>>,
    opening_time: Option<String>,
    closing_time: Option<String>,
    location: Option<Option<String>>,
    status: Option<String>,
) -> Result<ApiResponse<String>, String> {
    StoreHandler::update_store_data(&state, store_id, name, photo, opening_time, closing_time, location, status).await
}

#[tauri::command]
async fn delete_store_data(
    state: State<'_, AppState>,
    store_id: String,
) -> Result<String, String> {
    StoreHandler::delete_store_data(&state, store_id).await
}

#[tauri::command]
async fn view_souvenirs(
    state: State<'_, AppState>,
    store_id: Option<String>,
) -> Result<ApiResponse<Vec<entity::souvenir::Model>>, String> {
    SouvenirHandler::view_souvenirs(&state, store_id).await
}

#[tauri::command]
async fn get_souvenir_details(
    state: State<'_, AppState>,
    souvenir_id: String,
) -> Result<ApiResponse<entity::souvenir::Model>, String> {
    SouvenirHandler::get_souvenir_details(&state, souvenir_id).await
}

#[tauri::command]
async fn save_souvenir_data(
    state: State<'_, AppState>,
    name: String,
    photo: Option<String>,
    price: String,
    stock: i32,
    store_id: String,
) -> Result<ApiResponse<String>, String> {
    SouvenirHandler::save_souvenir_data(&state, name, photo, price, stock, store_id).await
}

#[tauri::command]
async fn update_souvenir_data(
    state: State<'_, AppState>,
    souvenir_id: String,
    name: Option<String>,
    photo: Option<Option<String>>,
    price: Option<String>,
    stock: Option<i32>,
    store_id: Option<String>,
) -> Result<ApiResponse<String>, String> {
    SouvenirHandler::update_souvenir_data(&state, souvenir_id, name, photo, price, stock, store_id).await
}

#[tauri::command]
async fn update_souvenir_stock(
    state: State<'_, AppState>,
    souvenir_id: String,
    stock: i32,
) -> Result<ApiResponse<String>, String> {
    SouvenirHandler::update_souvenir_stock(&state, souvenir_id, stock).await
}

#[tauri::command]
async fn delete_souvenir_data(
    state: State<'_, AppState>,
    souvenir_id: String,
) -> Result<String, String> {
    SouvenirHandler::delete_souvenir_data(&state, souvenir_id).await
}

#[tauri::command]
async fn view_order_souvenirs(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<entity::order_souvenir::Model>>, String> {
    OrderSouvenirHandler::view_order_souvenirs(&state).await
}

#[tauri::command]
async fn view_order_souvenirs_by_customer( // New command
    state: tauri::State<'_, AppState>,
    customer_id: String,
    store_id: String,
) -> Result<ApiResponse<Vec<entity::order_souvenir::Model>>, String> {
    OrderSouvenirHandler::view_order_souvenirs_by_customer(&state, customer_id, store_id).await
}

#[tauri::command]
async fn get_order_souvenir_details(
    state: State<'_, AppState>,
    order_souvenir_id: String,
) -> Result<ApiResponse<entity::order_souvenir::Model>, String> {
    OrderSouvenirHandler::get_order_souvenir_details(&state, order_souvenir_id).await
}

#[tauri::command]
async fn save_order_souvenir_data(
    state: State<'_, AppState>,
    customer_id: String,
    store_id: String,
    souvenir_id: String,
    quantity: i32,
) -> Result<ApiResponse<String>, String> {
    OrderSouvenirHandler::save_order_souvenir_data(&state, customer_id, store_id, souvenir_id, quantity).await
}

#[tauri::command]
async fn delete_order_souvenir_data(
    state: State<'_, AppState>,
    order_souvenir_id: String,
) -> Result<String, String> {
    OrderSouvenirHandler::delete_order_souvenir_data(&state, order_souvenir_id).await
}

// Tauri commands for LostAndFoundItemsLogHandler
#[tauri::command]
async fn view_logs(state: State<'_, AppState>) -> Result<ApiResponse<Vec<entity::lost_and_found_items_log::Model>>, String> {
    LostAndFoundItemsLogHandler::view_logs(&state).await
}

#[tauri::command]
async fn save_log_data(
    state: State<'_, AppState>,
    image: Option<String>,
    name: String,
    r#type: String,
    color: String,
    last_seen_location: Option<String>,
    finder: Option<String>,
    owner: Option<String>,
    found_location: Option<String>,
    status: String,
) -> Result<ApiResponse<String>, String> {
    LostAndFoundItemsLogHandler::save_log_data(
        &state,
        image,
        name,
        r#type,
        color,
        last_seen_location,
        finder,
        owner,
        found_location,
        status,
    ).await
}

#[tauri::command]
async fn update_log_data(
    state: State<'_, AppState>,
    log_id: String,
    image: Option<Option<String>>,
    name: Option<String>,
    r#type: Option<String>,
    color: Option<String>,
    last_seen_location: Option<Option<String>>,
    finder: Option<Option<String>>,
    owner: Option<Option<String>>,
    found_location: Option<Option<String>>,
    status: Option<String>,
) -> Result<ApiResponse<String>, String> {
    LostAndFoundItemsLogHandler::update_log_data(
        &state,
        log_id,
        image,
        name,
        r#type,
        color,
        last_seen_location,
        finder,
        owner,
        found_location,
        status,
    ).await
}

#[tauri::command]
async fn delete_log_data(state: State<'_, AppState>, log_id: String) -> Result<String, String> {
    LostAndFoundItemsLogHandler::delete_log_data(&state, log_id).await
}

// Chat related commands
#[tauri::command]
async fn view_chats(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<ApiResponse<Vec<entity::chat::Model>>, String> {
    ChatHandler::view_chats(&state, user_id).await
}

#[tauri::command]
async fn get_chat_details(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<ApiResponse<entity::chat::Model>, String> {
    ChatHandler::get_chat_details(&state, chat_id).await
}

#[tauri::command]
async fn save_chat_data(
    state: State<'_, AppState>,
    name: String,
) -> Result<ApiResponse<String>, String> {
    ChatHandler::save_chat_data(&state, name).await
}

#[tauri::command]
async fn get_messages(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<ApiResponse<Vec<MessageWithSenderName>>, String> {
    ChatHandler::get_messages(&state, chat_id).await
}

#[tauri::command]
async fn save_message_data(
    state: State<'_, AppState>,
    chat_id: String,
    sender_id: String,
    text: String,
) -> Result<ApiResponse<String>, String> {
    ChatHandler::save_message_data(&state, chat_id, sender_id, text).await
}

#[tauri::command]
async fn save_chat_member_data(
    state: State<'_, AppState>,
    chat_id: String,
    user_id: String,
) -> Result<ApiResponse<String>, String> {
    ChatHandler::save_chat_member_data(&state, chat_id, user_id).await
}

#[tauri::command]
async fn get_chat_members( // Example additional command
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<ApiResponse<Vec<entity::chat_member::Model>>, String> {
    ChatHandler::get_chat_members(&state, chat_id).await
}

#[tauri::command]
async fn get_customer_service_chat(
    state: State<'_, AppState>,
    customer_id: String,
) -> Result<ApiResponse<entity::chat::Model>, String> {
    ChatHandler::get_customer_service_chat(&state, customer_id).await
}

// NEW COMMAND: get_customer_chats_for_staff
#[tauri::command]
async fn view_customer_chats_for_staff( // New command
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<ChatWithCustomerName>>, String> {
    ChatHandler::get_customer_chats_for_staff(&state).await // Call new handler function
}

// Maintenance Schedule related commands
#[tauri::command]
async fn view_maintenance_schedules(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<entity::maintenance_schedule::Model>>, String> {
    MaintenanceScheduleHandler::view_maintenance_schedules(&state).await
}

#[tauri::command]
async fn view_maintenance_schedule_by_staff(
    state: State<'_, AppState>,
    staff_id: String,
) -> Result<ApiResponse<Vec<entity::maintenance_schedule::Model>>, String> {
    MaintenanceScheduleHandler::view_maintenance_schedule_by_staff(&state, staff_id).await
}

#[tauri::command]
async fn save_maintenance_schedule_data(
    state: State<'_, AppState>,
    ride_id: String,
    staff_id: String,
    description: Option<String>,
    start_date: String,
    end_date: String,
    status: String,
) -> Result<ApiResponse<String>, String> {
    MaintenanceScheduleHandler::save_maintenance_schedule_data(&state, ride_id, staff_id, description, start_date, end_date, status).await
}

#[tauri::command]
async fn update_maintenance_schedule_data(
    state: State<'_, AppState>,
    maintenance_task_id: String,
    ride_id: Option<String>,
    staff_id: Option<String>,
    description: Option<Option<String>>, // Match Option<Option<String>> for nullable update
    start_date: Option<String>,
    end_date: Option<String>,
    status: Option<String>,
) -> Result<ApiResponse<String>, String> {
    MaintenanceScheduleHandler::update_maintenance_schedule_data(&state, maintenance_task_id, ride_id, staff_id, description, start_date, end_date, status).await
}

#[tauri::command]
async fn delete_maintenance_schedule_data(
    state: State<'_, AppState>,
    maintenance_task_id: String,
) -> Result<String, String> {
    MaintenanceScheduleHandler::delete_maintenance_schedule_data(&state, maintenance_task_id).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            dotenv().ok();

            let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
            let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");

            // Create the runtime
            let rt = tokio::runtime::Runtime::new().unwrap();

            // Execute the future, blocking the current thread until completion
            let db = rt
                .block_on(Database::connect(&database_url))
                .expect("Failed to connect to database");

            let redis_cfg = RedisConfig::from_url(redis_url);
            let redis_pool = redis_cfg
                .create_pool(Some(Runtime::Tokio1))
                .expect("Failed to create Redis pool");

            app.manage(AppState { db, redis_pool });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_ui_name_from_config,
            customer_login, get_customer_details, view_customer_accounts, save_customer_data, update_customer_data, top_up_virtual_balance, delete_customer_data,
            staff_login, get_staff_details, get_staff_details_by_email, view_staff_accounts, view_ride_staffs, view_maintenance_staffs, save_staff_data, update_staff_data, delete_staff_data,
            view_restaurants, get_restaurant_details, save_restaurant_data, update_restaurant_data, delete_restaurant_data,
            view_menu_items, get_menu_item_details, save_menu_item_data, update_menu_item_data, delete_menu_item_data,
            view_order_restaurants, view_order_restaurants_by_customer, save_order_restaurant_data, update_order_restaurant_status, delete_order_restaurant_data,
            view_rides, get_ride_details, save_ride_data, update_ride_data, delete_ride_data,
            view_ride_queues, save_ride_queue_data, update_queue_position, delete_ride_queue_data,
            view_stores, get_store_details, save_store_data, update_store_data, delete_store_data,
            view_souvenirs, get_souvenir_details, save_souvenir_data, update_souvenir_data, update_souvenir_stock, delete_souvenir_data,
            view_order_souvenirs, view_order_souvenirs_by_customer, get_order_souvenir_details, save_order_souvenir_data, delete_order_souvenir_data,
            view_logs, save_log_data, update_log_data, delete_log_data,
            view_chats, get_chat_details, save_chat_data, get_messages, save_message_data, save_chat_member_data, get_chat_members, get_customer_service_chat, view_customer_chats_for_staff,
            view_maintenance_schedules, view_maintenance_schedule_by_staff, save_maintenance_schedule_data, update_maintenance_schedule_data, delete_maintenance_schedule_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
