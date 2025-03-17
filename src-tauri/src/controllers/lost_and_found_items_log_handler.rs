use sea_orm::{ActiveModelTrait, EntityTrait, QueryOrder, ColumnTrait};
use entity::lost_and_found_items_log::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{cache_delete, cache_get, cache_set, ApiResponse, AppState};

pub struct LostAndFoundItemsLogHandler;

impl LostAndFoundItemsLogHandler {
    /// View all lost and found logs, ordered by timestamp (most recent first)
    pub async fn view_logs(state: &AppState) -> Result<ApiResponse<Vec<Model>>, String> {
        let cache_key = "view_logs_cache";

        // Check Redis cache first
        if let Some(cached_logs) = cache_get::<Vec<Model>>(&state.redis_pool, cache_key).await {
            println!("Cache hit: Returning logs from Redis");
            return Ok(ApiResponse::success(cached_logs));
        }

        // Cache miss: Query the database
        println!("Cache miss: Querying database");
        match lost_and_found_items_log::Entity::find()
            .order_by_desc(lost_and_found_items_log::Column::Timestamp)
            .all(&state.db)
            .await
        {
            Ok(logs) => {
                // Cache the result for 60 seconds
                cache_set(&state.redis_pool, cache_key, &logs, 60).await;
                Ok(ApiResponse::success(logs))
            }
            Err(err) => Ok(ApiResponse::error(format!("Error fetching logs: {}", err))),
        }
    }

    /// Save a new lost and found log entry with auto-generated timestamp
    pub async fn save_log_data(
        state: &AppState,
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
        // Validate status
        if !["Returned to Owner", "Found", "Missing"].contains(&status.as_str()) {
            return Err("Invalid status provided. Must be 'Returned to Owner', 'Found', or 'Missing'.".to_string());
        }

        let log_id = Uuid::new_v4().to_string();

        let new_log = lost_and_found_items_log::ActiveModel {
            log_id: sea_orm::ActiveValue::Set(log_id),
            image: sea_orm::ActiveValue::Set(image),
            name: sea_orm::ActiveValue::Set(name),
            r#type: sea_orm::ActiveValue::Set(r#type),
            color: sea_orm::ActiveValue::Set(color),
            last_seen_location: sea_orm::ActiveValue::Set(last_seen_location),
            finder: sea_orm::ActiveValue::Set(finder),
            owner: sea_orm::ActiveValue::Set(owner),
            found_location: sea_orm::ActiveValue::Set(found_location),
            timestamp: sea_orm::ActiveValue::Set(chrono::Utc::now().naive_utc()),
            status: sea_orm::ActiveValue::Set(status),
            ..Default::default()
        };

        match lost_and_found_items_log::Entity::insert(new_log).exec(&state.db).await {
            Ok(_) => {
                // Invalidate the cache after creating a new entry
                cache_delete(&state.redis_pool, "view_logs_cache").await;
                Ok(ApiResponse::success("Log entry created successfully".to_string()))
            }
            Err(err) => Err(format!("Error creating log entry: {}", err)),
        }
    }

    /// Update an existing lost and found log entry with auto-updated timestamp
    pub async fn update_log_data(
        state: &AppState,
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
        let log_record = match lost_and_found_items_log::Entity::find_by_id(log_id).one(&state.db).await {
            Ok(Some(log)) => log,
            Ok(None) => return Err("Log entry not found".to_string()),
            Err(err) => return Err(format!("Error fetching log entry: {}", err)),
        };

        let mut active_log: lost_and_found_items_log::ActiveModel = log_record.into();

        if let Some(new_image) = image {
            active_log.image = sea_orm::ActiveValue::Set(new_image);
        }
        if let Some(new_name) = name {
            active_log.name = sea_orm::ActiveValue::Set(new_name);
        }
        if let Some(new_type) = r#type {
            active_log.r#type = sea_orm::ActiveValue::Set(new_type);
        }
        if let Some(new_color) = color {
            active_log.color = sea_orm::ActiveValue::Set(new_color);
        }
        if let Some(new_last_seen_location) = last_seen_location {
            active_log.last_seen_location = sea_orm::ActiveValue::Set(new_last_seen_location);
        }
        if let Some(new_finder) = finder {
            active_log.finder = sea_orm::ActiveValue::Set(new_finder);
        }
        if let Some(new_owner) = owner {
            active_log.owner = sea_orm::ActiveValue::Set(new_owner);
        }
        if let Some(new_found_location) = found_location {
            active_log.found_location = sea_orm::ActiveValue::Set(new_found_location);
        }
        // Auto-update timestamp to current time
        active_log.timestamp = sea_orm::ActiveValue::Set(chrono::Utc::now().naive_utc());
        if let Some(new_status) = status {
            if !["Returned to Owner", "Found", "Missing"].contains(&new_status.as_str()) {
                return Err("Invalid status provided. Must be 'Returned to Owner', 'Found', or 'Missing'.".to_string());
            }
            active_log.status = sea_orm::ActiveValue::Set(new_status);
        }

        match active_log.update(&state.db).await {
            Ok(_) => {
                // Invalidate the cache after updating an entry
                cache_delete(&state.redis_pool, "view_logs_cache").await;
                Ok(ApiResponse::success("Log entry updated successfully".to_string()))
            }
            Err(err) => Err(format!("Error updating log entry: {}", err)),
        }
    }

    /// Delete a lost and found log entry by log_id
    pub async fn delete_log_data(state: &AppState, log_id: String) -> Result<String, String> {
        match lost_and_found_items_log::Entity::delete_by_id(log_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    // Invalidate the cache after deleting an entry
                    cache_delete(&state.redis_pool, "view_logs_cache").await;
                    Ok("Log entry deleted successfully".to_string())
                } else {
                    Err("Log entry not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting log entry: {}", err)),
        }
    }
}