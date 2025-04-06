use sea_orm::{ActiveModelTrait, EntityTrait, QueryOrder, ColumnTrait};
use entity::store::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{cache_delete, cache_get, cache_set, ApiResponse, AppState};

pub struct StoreHandler;

impl StoreHandler {
    // View all stores
    pub async fn view_stores(state: &AppState) -> Result<ApiResponse<Vec<Model>>, String> {
        let cache_key = "view_stores_cache";

        // Check Redis cache first
        if let Some(cached_stores) = cache_get::<Vec<Model>>(&state.redis_pool, cache_key).await {
            println!("Cache hit: Returning stores from Redis");
            return Ok(ApiResponse::success(cached_stores));
        }

        // Cache miss: Query the database
        println!("Cache miss: Querying database");
        match store::Entity::find()
            .order_by_asc(store::Column::Name)
            .all(&state.db)
            .await
        {
            Ok(stores) => {
                // Cache the result for 60 seconds
                cache_set(&state.redis_pool, cache_key, &stores, 60).await;
                Ok(ApiResponse::success(stores))
            }
            Err(err) => Ok(ApiResponse::error(format!("Error fetching stores: {}", err))),
        }
    }

    // Get store details by ID
    pub async fn get_store_details(
        state: &AppState,
        store_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match store::Entity::find_by_id(store_id.clone()).one(&state.db).await {
            Ok(Some(store_details)) => Ok(ApiResponse::success(store_details)),
            Ok(None) => Err("Store not found".to_string()),
            Err(err) => Err(format!("Database error fetching store details: {}", err)),
        }
    }

    // Save store data (create new store)
    pub async fn save_store_data(
        state: &AppState,
        name: String,
        photo: Option<String>,
        opening_time: String,
        closing_time: String,
        location: Option<String>,
        status: String,
    ) -> Result<ApiResponse<String>, String> {
        let store_id = Uuid::new_v4().to_string();
        let opening_time_parsed = chrono::NaiveTime::parse_from_str(&opening_time, "%H:%M:%S").map_err(|e| format!("Invalid opening_time format: {}", e))?;
        let closing_time_parsed = chrono::NaiveTime::parse_from_str(&closing_time, "%H:%M:%S").map_err(|e| format!("Invalid closing_time format: {}", e))?;


        let new_store = store::ActiveModel {
            store_id: sea_orm::ActiveValue::Set(store_id),
            name: sea_orm::ActiveValue::Set(name),
            photo: sea_orm::ActiveValue::Set(photo),
            opening_time: sea_orm::ActiveValue::Set(opening_time_parsed),
            closing_time: sea_orm::ActiveValue::Set(closing_time_parsed),
            location: sea_orm::ActiveValue::Set(location),
            status: sea_orm::ActiveValue::Set(status),
            ..Default::default()
        };

        match store::Entity::insert(new_store).exec(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, "view_stores_cache").await;
                Ok(ApiResponse::success("Store created successfully".to_string()))
            }
            Err(err) => Err(format!("Error creating store: {}", err)),
        }
    }

    // Update store data
    pub async fn update_store_data(
        state: &AppState,
        store_id: String,
        name: Option<String>,
        photo: Option<Option<String>>, // Option<Option<String>> to allow setting to NULL
        opening_time: Option<String>,
        closing_time: Option<String>,
        location: Option<Option<String>>,
        status: Option<String>,
    ) -> Result<ApiResponse<String>, String> {
        let store_record = match store::Entity::find_by_id(store_id).one(&state.db).await {
            Ok(Some(store)) => store,
            Ok(None) => return Err("Store not found".to_string()),
            Err(err) => return Err(format!("Error fetching store: {}", err)),
        };

        let mut active_store: store::ActiveModel = store_record.into();

        if let Some(new_name) = name {
            active_store.name = sea_orm::ActiveValue::Set(new_name);
        }
        if let Some(new_photo) = photo {
            active_store.photo = sea_orm::ActiveValue::Set(new_photo);
        }
        if let Some(opening_time) = opening_time {
            let opening_time_parsed = chrono::NaiveTime::parse_from_str(&opening_time, "%H:%M:%S").map_err(|e| format!("Invalid opening_time format: {}", e))?;
            active_store.opening_time = sea_orm::ActiveValue::Set(opening_time_parsed);
        }
        if let Some(closing_time) = closing_time {
            let closing_time_parsed = chrono::NaiveTime::parse_from_str(&closing_time, "%H:%M:%S").map_err(|e| format!("Invalid closing_time format: {}", e))?;
            active_store.closing_time = sea_orm::ActiveValue::Set(closing_time_parsed);
        }
        if let Some(new_location) = location {
            active_store.location = sea_orm::ActiveValue::Set(new_location);
        }
        if let Some(new_status) = status {
            active_store.status = sea_orm::ActiveValue::Set(new_status);
        }


        match active_store.update(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, "view_stores_cache").await;
                Ok(ApiResponse::success("Store updated successfully".to_string()))
            }
            Err(err) => Err(format!("Error updating store: {}", err)),
        }
    }

    // Delete store data
    pub async fn delete_store_data(state: &AppState, store_id: String) -> Result<String, String> {
        match store::Entity::delete_by_id(store_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    cache_delete(&state.redis_pool, "view_stores_cache").await;
                    Ok("Store deleted successfully".to_string())
                } else {
                    Err("Store not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting store: {}", err)),
        }
    }
}