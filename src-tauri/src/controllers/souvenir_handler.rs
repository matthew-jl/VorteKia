use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use entity::souvenir::{self, ActiveModel, Model};
use uuid::Uuid;
use rust_decimal::Decimal;
use crate::{cache_delete, cache_get, cache_set, ApiResponse, AppState};

pub struct SouvenirHandler;

impl SouvenirHandler {
    // View all souvenirs, optionally filtered by store_id
    pub async fn view_souvenirs(state: &AppState, store_id: Option<String>) -> Result<ApiResponse<Vec<Model>>, String> {
        let cache_key = match &store_id {
            Some(id) => format!("view_souvenirs_cache_store_{}", id),
            None => "view_souvenirs_cache_all".to_string(),
        };

        // Check Redis cache first
        if let Some(cached_souvenirs) = cache_get::<Vec<Model>>(&state.redis_pool, &cache_key).await {
            println!("Cache hit: Returning souvenirs from Redis (key: {})", cache_key);
            return Ok(ApiResponse::success(cached_souvenirs));
        }

        // Cache miss: Query the database
        println!("Cache miss: Querying database (key: {})", cache_key);
        let mut query = souvenir::Entity::find().order_by_asc(souvenir::Column::Name);
        if let Some(store_id) = store_id {
            query = query.filter(souvenir::Column::StoreId.eq(store_id));
        }


        match query.all(&state.db).await
        {
            Ok(souvenirs) => {
                // Cache the result for 60 seconds
                cache_set(&state.redis_pool, &cache_key, &souvenirs, 60).await;
                Ok(ApiResponse::success(souvenirs))
            }
            Err(err) => Ok(ApiResponse::error(format!("Error fetching souvenirs: {}", err))),
        }
    }

    // Get souvenir details by ID
    pub async fn get_souvenir_details(
        state: &AppState,
        souvenir_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match souvenir::Entity::find_by_id(souvenir_id.clone()).one(&state.db).await {
            Ok(Some(souvenir_details)) => Ok(ApiResponse::success(souvenir_details)),
            Ok(None) => Err("Souvenir not found".to_string()),
            Err(err) => Err(format!("Database error fetching souvenir details: {}", err)),
        }
    }

    // Save souvenir data (create new souvenir)
    pub async fn save_souvenir_data(
        state: &AppState,
        name: String,
        photo: Option<String>,
        price: String,
        stock: i32,
        store_id: String,
    ) -> Result<ApiResponse<String>, String> {
        let souvenir_id = Uuid::new_v4().to_string();
        let price_decimal = Decimal::from_str_exact(&price).map_err(|e| format!("Invalid price format: {}", e))?;


        let new_souvenir = souvenir::ActiveModel {
            souvenir_id: sea_orm::ActiveValue::Set(souvenir_id),
            name: sea_orm::ActiveValue::Set(name),
            photo: sea_orm::ActiveValue::Set(photo),
            price: sea_orm::ActiveValue::Set(price_decimal),
            stock: sea_orm::ActiveValue::Set(stock),
            store_id: sea_orm::ActiveValue::Set(store_id.clone()),
            ..Default::default()
        };

        match souvenir::Entity::insert(new_souvenir).exec(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, "view_souvenirs_cache_all").await;
                cache_delete(&state.redis_pool, &format!("view_souvenirs_cache_store_{}", store_id)).await;
                Ok(ApiResponse::success("Souvenir created successfully".to_string()))
            }
            Err(err) => Err(format!("Error creating souvenir: {}", err)),
        }
    }

    // Update souvenir data
    pub async fn update_souvenir_data(
        state: &AppState,
        souvenir_id: String,
        name: Option<String>,
        photo: Option<Option<String>>, // Option<Option<String>> to allow setting to NULL
        price: Option<String>,
        stock: Option<i32>,
        store_id: Option<String>,
    ) -> Result<ApiResponse<String>, String> {
        let souvenir_record = match souvenir::Entity::find_by_id(souvenir_id).one(&state.db).await {
            Ok(Some(souvenir)) => souvenir,
            Ok(None) => return Err("Souvenir not found".to_string()),
            Err(err) => return Err(format!("Error fetching souvenir: {}", err)),
        };

        let mut active_souvenir: souvenir::ActiveModel = souvenir_record.into();

        if let Some(new_name) = name {
            active_souvenir.name = sea_orm::ActiveValue::Set(new_name);
        }
        if let Some(new_photo) = photo {
            active_souvenir.photo = sea_orm::ActiveValue::Set(new_photo);
        }
        if let Some(new_price_str) = price {
            let new_price = Decimal::from_str_exact(&new_price_str).map_err(|e| format!("Invalid price format: {}", e))?;
            active_souvenir.price = sea_orm::ActiveValue::Set(new_price);
        }
        if let Some(new_stock) = stock {
            active_souvenir.stock = sea_orm::ActiveValue::Set(new_stock);
        }
        if let Some(new_store_id) = store_id {
            active_souvenir.store_id = sea_orm::ActiveValue::Set(new_store_id);
        }


        match active_souvenir.update(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, "view_souvenirs_cache_all").await;
                // Invalidate cache for specific store as well, if store_id is updated in future versions
                // if let Some(store_id) = store_id {
                //     cache_delete(&state.redis_pool, &format!("view_souvenirs_cache_store_{}", store_id)).await;
                // }
                Ok(ApiResponse::success("Souvenir updated successfully".to_string()))
            }
            Err(err) => Err(format!("Error updating souvenir: {}", err)),
        }
    }

    // Update souvenir stock
    pub async fn update_souvenir_stock(
        state: &AppState,
        souvenir_id: String,
        stock: i32,
    ) -> Result<ApiResponse<String>, String> {
        let souvenir_record = match souvenir::Entity::find_by_id(souvenir_id).one(&state.db).await {
            Ok(Some(souvenir)) => souvenir,
            Ok(None) => return Err("Souvenir not found".to_string()),
            Err(err) => return Err(format!("Error fetching souvenir: {}", err)),
        };

        let mut active_souvenir: souvenir::ActiveModel = souvenir_record.into();
        active_souvenir.stock = Set(stock);


        match active_souvenir.update(&state.db).await {
            Ok(_) => {
                // No need to delete cache for view_souvenirs here, as stock change might not affect the general view significantly,
                // or you can choose to invalidate cache if stock level is critical for the view.
                // cache_delete(&state.redis_pool, "view_souvenirs_cache").await;
                Ok(ApiResponse::success("Souvenir stock updated successfully".to_string()))
            }
            Err(err) => Err(format!("Error updating souvenir stock: {}", err)),
        }
    }


    // Delete souvenir data
    pub async fn delete_souvenir_data(state: &AppState, souvenir_id: String) -> Result<String, String> {
        match souvenir::Entity::delete_by_id(souvenir_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    cache_delete(&state.redis_pool, "view_souvenirs_cache_all").await;
                    // Invalidate cache for specific store as well, if store-specific cache invalidation is implemented
                    // cache_delete(&state.redis_pool, &format!("view_souvenirs_cache_store_{}", store_id)).await;
                    Ok("Souvenir deleted successfully".to_string())
                } else {
                    Err("Souvenir not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting souvenir: {}", err)),
        }
    }
}