use chrono::{DateTime, Utc};
use sea_orm::{ActiveModelTrait, ColumnTrait, Condition, EntityTrait, QueryFilter, QueryOrder, Set};
use entity::order_restaurant::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{ApiResponse, AppState};

pub struct OrderRestaurantHandler;

impl OrderRestaurantHandler {
    // View all restaurant orders (or for a specific restaurant if restaurant_id is provided)
    pub async fn view_order_restaurants( // Renamed function
        state: &AppState,
        restaurant_id: Option<String>,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        let mut query = order_restaurant::Entity::find().order_by_asc(order_restaurant::Column::Timestamp);

        if let Some(restaurant_id) = restaurant_id {
            query = query.filter(order_restaurant::Column::RestaurantId.eq(restaurant_id));
        }

        match query.all(&state.db).await {
            Ok(orders) => Ok(ApiResponse::success(orders)),
            Err(err) => Err(format!("Error fetching restaurant orders: {}", err)),
        }
    }

    pub async fn view_order_restaurants_by_customer(
        state: &AppState,
        customer_id: String,
        restaurant_id: String, // Added restaurant_id parameter
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        match order_restaurant::Entity::find()
            .filter(order_restaurant::Column::CustomerId.eq(customer_id))
            .filter(order_restaurant::Column::RestaurantId.eq(restaurant_id)) // Added filter
            .order_by_asc(order_restaurant::Column::Timestamp)
            .all(&state.db)
            .await
        {
            Ok(orders) => Ok(ApiResponse::success(orders)),
            Err(err) => Err(format!("Error fetching orders for customer: {}", err)),
        }
    }

    // Get restaurant orders within a time range
    pub async fn get_restaurant_orders_in_range(
        state: &AppState,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        match order_restaurant::Entity::find()
            .filter(
                Condition::all()
                    .add(order_restaurant::Column::Timestamp.gte(start_time.naive_utc())) // Greater than or equal to start_time
                    .add(order_restaurant::Column::Timestamp.lt(end_time.naive_utc()))    // Less than end_time
            )
            .all(&state.db)
            .await
        {
            Ok(orders) => Ok(ApiResponse::success(orders)),
            Err(err) => Err(format!("Error fetching restaurant orders in range: {}", err)),
        }
    }

    // Create a new restaurant order
    pub async fn save_order_restaurant_data( // Renamed function
        state: &AppState,
        customer_id: String,
        restaurant_id: String,
        menu_item_id: String,
        quantity: i32,
    ) -> Result<ApiResponse<String>, String> {
        let order_restaurant_id = Uuid::new_v4().to_string();

        let jakarta_time = Utc::now()
            .with_timezone(&chrono::FixedOffset::east_opt(7 * 3600).unwrap())
            .naive_local();

        let new_order = order_restaurant::ActiveModel {
            order_restaurant_id: Set(order_restaurant_id),
            customer_id: Set(customer_id),
            restaurant_id: Set(restaurant_id),
            menu_item_id: Set(menu_item_id),
            quantity: Set(quantity),
            timestamp: Set(jakarta_time), // Auto-set to current time
            status: Set("Pending".to_string()), // Initial status
            ..Default::default()
        };

        match order_restaurant::Entity::insert(new_order).exec(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Restaurant order created successfully".to_string())),
            Err(err) => Err(format!("Error creating restaurant order: {}", err)),
        }
    }

    // Update the status of a restaurant order
    pub async fn update_order_restaurant_status(
        state: &AppState,
        order_restaurant_id: String,
        status: String,
    ) -> Result<ApiResponse<String>, String> {

        if !["Pending", "Cooking", "Ready to Serve", "Complete"].contains(&status.as_str()) {
          return Err("Invalid status provided.".to_string());
        }
        let order_record = match order_restaurant::Entity::find_by_id(order_restaurant_id)
            .one(&state.db)
            .await
        {
            Ok(Some(order)) => order,
            Ok(None) => return Err("Restaurant order not found".to_string()),
            Err(err) => return Err(format!("Error fetching restaurant order: {}", err)),
        };

        let mut active_order: order_restaurant::ActiveModel = order_record.into();
        active_order.status = Set(status);

        match active_order.update(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Order status updated successfully".to_string())),
            Err(err) => Err(format!("Error updating order status: {}", err)),
        }
    }

    // Delete a restaurant order
    pub async fn delete_order_restaurant_data( // Renamed Function
        state: &AppState,
        order_restaurant_id: String,
    ) -> Result<ApiResponse<String>, String> {
        match order_restaurant::Entity::delete_by_id(order_restaurant_id)
            .exec(&state.db)
            .await
        {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok(ApiResponse::success("Restaurant order deleted successfully".to_string()))
                } else {
                    Err("Restaurant order not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting restaurant order: {}", err)),
        }
    }
}