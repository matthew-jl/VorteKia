use sea_orm::{ActiveModelTrait, EntityTrait};
use entity::customer::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{ApiResponse, AppState};

pub struct CustomerHandler;

impl CustomerHandler {

    // Customer Login
    pub async fn customer_login(state: &AppState, customer_id: String) -> Result<ApiResponse<String>, String> {
        match customer::Entity::find_by_id(customer_id.clone()).one(&state.db).await {
            Ok(Some(_customer)) => { // Customer found (we can use _customer if we need to return customer details later)
                // For now, let's generate a simple session token (UUID)
                let session_token = Uuid::new_v4().to_string();
                // In a real application, you might want to store this session token
                // in a database associated with the user, and handle session expiry, etc.
                Ok(ApiResponse::success(session_token))
            }
            Ok(None) => {
                Err("Invalid Customer UID".to_string()) // Customer not found
            }
            Err(err) => {
                Err(format!("Database error during login: {}", err))
            }
        }
    }

    // Get customer details by ID
    pub async fn get_customer_details(
        state: &AppState,
        customer_id: String,
    ) -> Result<ApiResponse<Model>, String> { // Return ApiResponse with Customer Model
        match customer::Entity::find_by_id(customer_id.clone()).one(&state.db).await {
            Ok(Some(customer_details)) => {
                Ok(ApiResponse::success(customer_details)) // Return the customer model on success
            }
            Ok(None) => {
                Err("Customer not found".to_string())
            }
            Err(err) => {
                Err(format!("Database error fetching customer details: {}", err))
            }
        }
    }

    // View customer accounts
    pub async fn view_customer_accounts(state: &AppState) -> Result<ApiResponse<Vec<Model>>, String> {
        match customer::Entity::find().all(&state.db).await {
            Ok(customers) => Ok(ApiResponse::success(customers)),
            Err(err) => Err(format!("Error fetching customers: {}", err)),
        }
    }

    // Save customer data (create new customer)
    pub async fn save_customer_data(
        state: &AppState,
        name: String,
        virtual_balance: String,
    ) -> Result<ApiResponse<String>, String> {
        // Generate a UUID for the customer_id
        let customer_id = Uuid::new_v4().to_string();  // Generate a v4 UUID

        let new_customer = customer::ActiveModel {
            customer_id: sea_orm::ActiveValue::Set(customer_id),  // Set the generated customer_id
            name: sea_orm::ActiveValue::Set(name),
            virtual_balance: sea_orm::ActiveValue::Set(virtual_balance),
            ..Default::default()
        };

        match customer::Entity::insert(new_customer).exec(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Customer created successfully".to_string())),
            Err(err) => Err(format!("Error creating customer: {}", err)),
        }
    }

    // Update customer data
    pub async fn update_customer_data(
        state: &AppState,
        customer_id: String,
        name: Option<String>,
        virtual_balance: Option<String>,
    ) -> Result<String, String> {
        let customer = match customer::Entity::find_by_id(customer_id).one(&state.db).await {
            Ok(Some(customer)) => customer,
            Ok(None) => return Err("Customer not found".to_string()),
            Err(err) => return Err(format!("Error fetching customer: {}", err)),
        };

        // Create an ActiveModel from the retrieved customer
        let mut active_customer: customer::ActiveModel = customer.into();

        if let Some(new_name) = name {
            active_customer.name = sea_orm::ActiveValue::Set(new_name);
        }

        if let Some(new_balance) = virtual_balance {
            active_customer.virtual_balance = sea_orm::ActiveValue::Set(new_balance);
        }

        match active_customer.update(&state.db).await {
            Ok(_) => Ok("Customer updated successfully".to_string()),
            Err(err) => Err(format!("Error updating customer: {}", err)),
        }
    }

    // Top up customer virtual balance
    pub async fn top_up_virtual_balance(
        state: &AppState,
        customer_id: String,
        top_up_amount_str: String, // Receive top-up amount as string from frontend
    ) -> Result<ApiResponse<String>, String> {
        let customer_result = customer::Entity::find_by_id(customer_id.clone()).one(&state.db).await;

        match customer_result {
            Ok(Some(customer)) => {
                // Get current balance as String from the database
                let current_balance_str = customer.virtual_balance.clone();

                // Parse current balance and top-up amount to i64 (integer)
                let current_balance = match current_balance_str.parse::<i64>() {
                    Ok(balance) => balance,
                    Err(_) => 0, // Default to 0 if parsing fails (handle error more robustly if needed)
                };
                let top_up_amount = match top_up_amount_str.parse::<i64>() {
                    Ok(amount) => amount,
                    Err(_) => 0, // Default to 0 if parsing fails (handle error more robustly if needed)
                };

                // Ensure top_up_amount is not negative (optional, but good practice)
                if top_up_amount <= 0 {
                    return Err("Top-up amount must be a positive whole number".to_string());
                }

                // Calculate new balance
                let new_balance = current_balance + top_up_amount;

                // Convert new balance back to String for database storage
                let new_balance_str = new_balance.to_string();

                // Update customer data with new balance
                match Self::update_customer_data(
                    state,
                    customer_id.clone(),
                    None, // No name update
                    Some(new_balance_str), // Update virtual balance
                ).await {
                    Ok(_) => Ok(ApiResponse::success("Virtual balance topped up successfully".to_string())),
                    Err(err) => Err(format!("Error updating balance in database: {}", err)),
                }
            }
            Ok(None) => Err("Customer not found".to_string()),
            Err(err) => Err(format!("Error fetching customer: {}", err)),
        }
    }


    // Delete customer data
    pub async fn delete_customer_data(state: &AppState, customer_id: String) -> Result<String, String> {
        match customer::Entity::delete_by_id(customer_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok("Customer deleted successfully".to_string())
                } else {
                    Err("Customer not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting customer: {}", err)),
        }
    }
}
