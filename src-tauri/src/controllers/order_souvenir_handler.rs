use chrono::{DateTime, Utc};
use sea_orm::{ActiveModelTrait, ColumnTrait, Condition, EntityTrait, QueryFilter, QueryOrder};
use entity::order_souvenir::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{cache_delete, cache_get, cache_set, ApiResponse, AppState};

pub struct OrderSouvenirHandler;

impl OrderSouvenirHandler {
    // View all order_souvenirs
    pub async fn view_order_souvenirs(state: &AppState) -> Result<ApiResponse<Vec<Model>>, String> {
        let cache_key = "view_order_souvenirs_cache";

        // Check Redis cache first
        if let Some(cached_order_souvenirs) = cache_get::<Vec<Model>>(&state.redis_pool, cache_key).await {
            println!("Cache hit: Returning order_souvenirs from Redis");
            return Ok(ApiResponse::success(cached_order_souvenirs));
        }

        // Cache miss: Query the database
        println!("Cache miss: Querying database");
        match order_souvenir::Entity::find()
            .order_by_asc(order_souvenir::Column::Timestamp)
            .all(&state.db)
            .await
        {
            Ok(order_souvenirs) => {
                // Cache the result for 60 seconds
                cache_set(&state.redis_pool, cache_key, &order_souvenirs, 60).await;
                Ok(ApiResponse::success(order_souvenirs))
            }
            Err(err) => Ok(ApiResponse::error(format!("Error fetching order_souvenirs: {}", err))),
        }
    }

    pub async fn view_order_souvenirs_by_customer(
        state: &AppState,
        customer_id: String,
        store_id: String,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        match order_souvenir::Entity::find()
            .filter(order_souvenir::Column::CustomerId.eq(customer_id))
            .filter(order_souvenir::Column::StoreId.eq(store_id))
            .order_by_asc(order_souvenir::Column::Timestamp)
            .all(&state.db)
            .await
        {
            Ok(orders) => Ok(ApiResponse::success(orders)),
            Err(err) => Err(format!("Error fetching souvenir orders for customer: {}", err)),
        }
    }

    // Get souvenir orders within a time range
    pub async fn get_souvenir_orders_in_range(
        state: &AppState,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        match order_souvenir::Entity::find()
            .filter(
                Condition::all()
                    .add(order_souvenir::Column::Timestamp.gte(start_time.naive_utc()))
                    .add(order_souvenir::Column::Timestamp.lt(end_time.naive_utc()))
            )
            .all(&state.db)
            .await
        {
            Ok(orders) => Ok(ApiResponse::success(orders)),
            Err(err) => Err(format!("Error fetching souvenir orders in range: {}", err)),
        }
    }

    // Get order_souvenir details by ID
    pub async fn get_order_souvenir_details(
        state: &AppState,
        order_souvenir_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match order_souvenir::Entity::find_by_id(order_souvenir_id.clone()).one(&state.db).await {
            Ok(Some(order_souvenir_details)) => Ok(ApiResponse::success(order_souvenir_details)),
            Ok(None) => Err("OrderSouvenir not found".to_string()),
            Err(err) => Err(format!("Database error fetching order_souvenir details: {}", err)),
        }
    }

    // Save order_souvenir data (create new order_souvenir)
    pub async fn save_order_souvenir_data(
        state: &AppState,
        customer_id: String,
        store_id: String,
        souvenir_id: String,
        quantity: i32,
    ) -> Result<ApiResponse<String>, String> {
        let order_souvenir_id = Uuid::new_v4().to_string();

        let jakarta_time = Utc::now()
            .with_timezone(&chrono::FixedOffset::east_opt(7 * 3600).unwrap())
            .naive_local();

        let new_order_souvenir = order_souvenir::ActiveModel {
            order_souvenir_id: sea_orm::ActiveValue::Set(order_souvenir_id),
            customer_id: sea_orm::ActiveValue::Set(customer_id),
            store_id: sea_orm::ActiveValue::Set(store_id),
            souvenir_id: sea_orm::ActiveValue::Set(souvenir_id),
            quantity: sea_orm::ActiveValue::Set(quantity),
            timestamp: sea_orm::ActiveValue::Set(jakarta_time),
            ..Default::default()
        };

        match order_souvenir::Entity::insert(new_order_souvenir).exec(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, "view_order_souvenirs_cache").await;
                Ok(ApiResponse::success("OrderSouvenir created successfully".to_string()))
            }
            Err(err) => Err(format!("Error creating order_souvenir: {}", err)),
        }
    }

    // Delete order_souvenir data
    pub async fn delete_order_souvenir_data(state: &AppState, order_souvenir_id: String) -> Result<String, String> {
        match order_souvenir::Entity::delete_by_id(order_souvenir_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    cache_delete(&state.redis_pool, "view_order_souvenirs_cache").await;
                    Ok("OrderSouvenir deleted successfully".to_string())
                } else {
                    Err("OrderSouvenir not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting order_souvenir: {}", err)),
        }
    }
}