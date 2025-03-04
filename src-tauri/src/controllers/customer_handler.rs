use sea_orm::{ActiveModelTrait, EntityTrait};
use entity::customer::{self, ActiveModel, Model};
use crate::AppState;

pub struct CustomerHandler;

impl CustomerHandler {
    // View customer accounts
    pub async fn view_customer_accounts(state: &AppState) -> Result<Vec<Model>, String> {
        match customer::Entity::find().all(&state.db).await {
            Ok(customers) => Ok(customers),
            Err(err) => Err(format!("Error fetching customers: {}", err)),
        }
    }

    // Save customer data (create new customer)
    pub async fn save_customer_data(
        state: &AppState,
        name: String,
        virtual_balance: String,
    ) -> Result<String, String> {
        let new_customer = ActiveModel {
            name: sea_orm::ActiveValue::Set(name),
            virtual_balance: sea_orm::ActiveValue::Set(virtual_balance),
            ..Default::default()
        };

        match customer::Entity::insert(new_customer).exec(&state.db).await {
            Ok(_) => Ok("Customer created successfully".to_string()),
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
        let mut customer = match customer::Entity::find_by_id(customer_id).one(&state.db).await {
            Ok(Some(customer)) => customer,
            Ok(None) => return Err("Customer not found".to_string()),
            Err(err) => return Err(format!("Error fetching customer: {}", err)),
        };

        if let Some(new_name) = name {
            customer.name = new_name;
        }

        if let Some(new_balance) = virtual_balance {
            customer.virtual_balance = new_balance;
        }

        match customer.update(&state.db).await {
            Ok(_) => Ok("Customer updated successfully".to_string()),
            Err(err) => Err(format!("Error updating customer: {}", err)),
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
