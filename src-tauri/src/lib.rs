use anyhow::Result;
use deadpool_redis::{redis::cmd, Config as RedisConfig, Pool as RedisPool, Runtime};
use dotenv::dotenv;
use entity::post::{self, ActiveModel as PostActiveModel, Entity as Post};
use sea_orm::ActiveValue::Set;
use sea_orm::{ActiveModelTrait, QueryOrder};
use sea_orm::{Database, DatabaseConnection, EntityTrait};
use serde::{Deserialize, Serialize};
use std::env;
use std::{fs::File, io::Read};
use tauri::{command, Manager, State};

use entity::customer::Model as CustomerModel;
use crate::controllers::customer_handler::CustomerHandler;
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
struct CachedData<T> {
    data: T,
}

async fn cache_set<T: Serialize>(pool: &RedisPool, key: &str, value: &T, ttl: usize) {
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

async fn cache_delete(pool: &RedisPool, key: &str) {
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

async fn cache_get<T: for<'de> Deserialize<'de>>(pool: &RedisPool, key: &str) -> Option<T> {
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

#[command]
async fn get_all_posts(
    state: State<'_, AppState>,
) -> Result<ApiResponse<Vec<post::Model>>, String> {
    let cache_key = "get_all_posts_cache";

    if let Some(cached_posts) = cache_get::<Vec<post::Model>>(&state.redis_pool, cache_key).await {
        println!("Cache hit: Returning posts from Redis");
        return Ok(ApiResponse::success(cached_posts));
    }

    println!("Cache miss: Querying database");
    match Post::find()
        .order_by_asc(post::Column::Id)
        .all(&state.db)
        .await
    {
        Ok(posts) => {
            cache_set(&state.redis_pool, cache_key, &posts, 60).await;
            Ok(ApiResponse::success(posts))
        }
        Err(err) => Ok(ApiResponse::error(format!("Database error: {}", err))),
    }
}

#[derive(Deserialize)]
struct DeletePostRequest {
    id: i32,
}

#[command]
async fn delete_post(
    state: State<'_, AppState>,
    payload: DeletePostRequest,
) -> Result<ApiResponse<()>, String> {
    match Post::delete_by_id(payload.id).exec(&state.db).await {
        Ok(delete_result) => {
            if delete_result.rows_affected == 0 {
                return Ok(ApiResponse::error(format!(
                    "No post found with ID: {}",
                    payload.id
                )));
            }

            cache_delete(&state.redis_pool, "get_all_posts_cache").await;
            Ok(ApiResponse::success(()))
        }
        Err(err) => Ok(ApiResponse::error(format!(
            "Failed to delete post: {}",
            err
        ))),
    }
}

#[derive(Deserialize)]
struct CreatePostRequest {
    title: String,
    text: String,
}

#[command]
async fn create_post(
    state: State<'_, AppState>,
    payload: CreatePostRequest,
) -> Result<ApiResponse<post::Model>, String> {
    let new_post = PostActiveModel {
        title: Set(payload.title),
        text: Set(payload.text),
        ..Default::default()
    };

    match new_post.insert(&state.db).await {
        Ok(post) => {
            cache_delete(&state.redis_pool, "get_all_posts_cache").await;
            Ok(ApiResponse::success(post))
        }
        Err(err) => Ok(ApiResponse::error(format!(
            "Failed to create post: {}",
            err
        ))),
    }
}

#[derive(Deserialize)]
struct UpdatePostRequest {
    id: i32,
    title: String,
    text: String,
}

#[command]
async fn update_post(
    state: State<'_, AppState>,
    payload: UpdatePostRequest,
) -> Result<ApiResponse<post::Model>, String> {
    match Post::find_by_id(payload.id).one(&state.db).await {
        Ok(Some(existing_post)) => {
            let mut active_post: PostActiveModel = existing_post.into();
            active_post.title = Set(payload.title);
            active_post.text = Set(payload.text);

            match active_post.update(&state.db).await {
                Ok(updated_post) => {
                    cache_delete(&state.redis_pool, "get_all_posts_cache").await;
                    Ok(ApiResponse::success(updated_post))
                }
                Err(err) => Ok(ApiResponse::error(format!(
                    "Failed to update post: {}",
                    err
                ))),
            }
        }
        Ok(None) => Ok(ApiResponse::error(format!(
            "No post found with ID: {}",
            payload.id
        ))),
        Err(err) => Ok(ApiResponse::error(format!(
            "Database error while updating post: {}",
            err
        ))),
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
        "RI-001" => "ride",
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
async fn view_customer_accounts(state: State<'_, AppState>) -> Result<ApiResponse<Vec<CustomerModel>>, String> {
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
            get_all_posts,
            create_post,
            delete_post,
            update_post,
            get_ui_name_from_config,
            customer_login,
            get_customer_details,
            view_customer_accounts,
            save_customer_data,
            update_customer_data,
            top_up_virtual_balance,
            delete_customer_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
