use anyhow::Result;
use deadpool_redis::{redis::cmd, Config as RedisConfig, Pool as RedisPool, Runtime};
use dotenv::dotenv;
use sea_orm::ActiveValue::Set;
use sea_orm::{ActiveModelTrait, QueryOrder};
use sea_orm::{Database, DatabaseConnection, EntityTrait};
use serde::{Deserialize, Serialize};
use std::env;
use std::{fs::File, io::Read};
use tauri::{command, Manager, State};

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
        "RE-001" => "restaurant",
        "RI-000" => "ride/6f860dcf-d7e8-4a09-ad0b-4fbfa783a144", // Kora Kora (Closed)
        "RI-001" => "ride/bf3d0465-377f-4a36-8fef-f491ddd5591a", // Vortex Odyssey
        "RI-002" => "ride/a38a0c09-f6c2-4889-8fe8-be78f2cecaf9", // Neon Battle Arena
        "RI-003" => "ride/be758d9e-5273-4789-a75b-cac22e20a301", // Robo World Pavilion (Pending)
        "SR-001" => "store",
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
async fn customer_login(state: State<'_, AppState>, customer_id: String) -> Result<ApiResponse<String>, String> { // Expose customer_login
    CustomerHandler::customer_login(&state, customer_id).await
}

// Get customer details by ID
#[tauri::command]
async fn get_customer_details(
    state: State<'_, AppState>,
    customer_id: String,
) -> Result<ApiResponse<entity::customer::Model>, String> { // Return ApiResponse with Customer Model
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
    top_up_amount_str: String, // Match parameter type with backend function
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
) -> Result<ApiResponse<String>, String> { // Return ApiResponse<String> for consistency
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
    opening_time: String, // Pass opening_time as String
    closing_time: String, // Pass closing_time as String
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
    photo: Option<Option<String>>, // Match Option<Option<String>> for update
    opening_time: Option<String>, // Pass optional times as String
    closing_time: Option<String>, // Pass optional times as String
    cuisine_type: Option<String>,
    location: Option<Option<String>>, // Match Option<Option<String>> for location
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
    restaurant_id: Option<String>, // Allow optional restaurant_id for filtering
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
    restaurant_id: String, // Required restaurant_id
) -> Result<ApiResponse<String>, String> {
    MenuItemHandler::save_menu_item_data(&state, photo, name, price, restaurant_id).await
}

#[tauri::command]
async fn update_menu_item_data(
    state: State<'_, AppState>,
    menu_item_id: String,
    photo: Option<Option<String>>, // Match Option<Option<String>>
    name: Option<String>,
    price: Option<String>,
    restaurant_id: Option<String>, // Allow optional restaurant_id update
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
    photo: Option<Option<String>>, // Match Option<Option<String>> for nullable update
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
    queue_position: String, // Receive as String, parse to Decimal in handler
) -> Result<ApiResponse<String>, String> {
    let position = queue_position.parse::<rust_decimal::Decimal>()
        .map_err(|e| format!("Invalid queue position: {}", e))?;
    RideQueueHandler::save_ride_queue_data(&state, ride_id, customer_id, position).await
}

#[tauri::command]
async fn update_queue_position(
    state: State<'_, AppState>,
    ride_queue_id: String,
    queue_position: String, // Receive as String, parse to Decimal in handler
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
            staff_login, get_staff_details, get_staff_details_by_email, view_staff_accounts, save_staff_data, update_staff_data, delete_staff_data,
            view_restaurants, get_restaurant_details, save_restaurant_data, update_restaurant_data, delete_restaurant_data,
            view_menu_items, get_menu_item_details, save_menu_item_data, update_menu_item_data, delete_menu_item_data,
            view_rides, get_ride_details, save_ride_data, update_ride_data, delete_ride_data,
            view_ride_queues, save_ride_queue_data, update_queue_position, delete_ride_queue_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
