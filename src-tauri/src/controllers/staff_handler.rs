use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect, ColumnTrait};
use entity::staff::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{ApiResponse, AppState};
use bcrypt::{hash, verify, BcryptResult, DEFAULT_COST}; // Import bcrypt -> Salting is automatic and built into bcrypt

pub struct StaffHandler;

impl StaffHandler {
    // Staff Login
    pub async fn staff_login(state: &AppState, email: String, password: String) -> Result<ApiResponse<String>, String> {
        match staff::Entity::find()
            .filter(staff::Column::Email.eq(email.clone()))
            .one(&state.db)
            .await
        {
            Ok(Some(staff_member)) => {
                // Verify password
                // bcrypt::verify extracts the salt from the stored hash to perform verification
                match verify(password, &staff_member.password_hash) {
                    Ok(true) => {
                        // Passwords match - generate session token
                        let session_token = Uuid::new_v4().to_string();
                        Ok(ApiResponse::success(session_token))
                    }
                    Ok(false) => {
                        Err("Invalid password".to_string()) // Passwords don't match
                    }
                    Err(err) => {
                        Err(format!("Password verification error: {}", err)) // Bcrypt error
                    }
                }
            }
            Ok(None) => {
                Err("Invalid email or password".to_string()) // Staff not found or incorrect email
            }
            Err(err) => {
                Err(format!("Database error during login: {}", err)) // Database error
            }
        }
    }

    // Get staff details by Email
    pub async fn get_staff_details_by_email(
        state: &AppState,
        email: String,
    ) -> Result<ApiResponse<Model>, String> {
        match staff::Entity::find()
            .filter(staff::Column::Email.eq(email.clone()))
            .one(&state.db)
            .await
        {
            Ok(Some(staff_details)) => {
                Ok(ApiResponse::success(staff_details))
            }
            Ok(None) => {
                Err("Staff not found with this email".to_string())
            }
            Err(err) => {
                Err(format!("Database error fetching staff details: {}", err))
            }
        }
    }

    // Get staff details by ID
    pub async fn get_staff_details(
        state: &AppState,
        staff_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match staff::Entity::find_by_id(staff_id.clone()).one(&state.db).await {
            Ok(Some(staff_details)) => {
                Ok(ApiResponse::success(staff_details))
            }
            Ok(None) => {
                Err("Staff not found".to_string())
            }
            Err(err) => {
                Err(format!("Database error fetching staff details: {}", err))
            }
        }
    }

    // View staff accounts
    pub async fn view_staff_accounts(state: &AppState) -> Result<ApiResponse<Vec<Model>>, String> {
        match staff::Entity::find().order_by_asc(staff::Column::Name).all(&state.db).await { // Order by staff name for better readability
            Ok(staff_list) => Ok(ApiResponse::success(staff_list)),
            Err(err) => Err(format!("Error fetching staff accounts: {}", err)),
        }
    }

    // Save staff data (create new staff account)
    pub async fn save_staff_data(
        state: &AppState,
        email: String,
        password: String,
        name: String,
        role: String,
    ) -> Result<ApiResponse<String>, String> {
        // Generate a UUID for the staff_id
        let staff_id = Uuid::new_v4().to_string();

        // Hash the password with bcrypt
        // bcrypt::hash generates a salt and embeds it in the output hash
        match hash(password, DEFAULT_COST) {
            Ok(password_hash) => {
                let new_staff = staff::ActiveModel {
                    staff_id: sea_orm::ActiveValue::Set(staff_id),
                    email: sea_orm::ActiveValue::Set(email),
                    password_hash: sea_orm::ActiveValue::Set(password_hash), // Store the hashed password
                    name: sea_orm::ActiveValue::Set(name),
                    role: sea_orm::ActiveValue::Set(role),
                    ..Default::default()
                };

                match staff::Entity::insert(new_staff).exec(&state.db).await {
                    Ok(_) => Ok(ApiResponse::success("Staff account created successfully".to_string())),
                    Err(err) => Err(format!("Error creating staff account: {}", err)),
                }
            }
            Err(err) => Err(format!("Password hashing failed: {}", err)), // Hashing error
        }
    }

    // Update staff data
    pub async fn update_staff_data(
        state: &AppState,
        staff_id: String,
        email: Option<String>,
        name: Option<String>,
        role: Option<String>,
    ) -> Result<ApiResponse<String>, String> {
        let staff_member = match staff::Entity::find_by_id(staff_id).one(&state.db).await {
            Ok(Some(staff_member)) => staff_member,
            Ok(None) => return Err("Staff account not found".to_string()),
            Err(err) => return Err(format!("Error fetching staff account: {}", err)),
        };

        let mut active_staff_member: staff::ActiveModel = staff_member.into();

        if let Some(new_email) = email {
            active_staff_member.email = sea_orm::ActiveValue::Set(new_email);
        }
        if let Some(new_name) = name {
            active_staff_member.name = sea_orm::ActiveValue::Set(new_name);
        }
        if let Some(new_role) = role {
            active_staff_member.role = sea_orm::ActiveValue::Set(new_role);
        }
        match active_staff_member.update(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Staff account updated successfully".to_string())),
            Err(err) => Err(format!("Error updating staff account: {}", err)),
        }
    }

    // Delete staff data
    pub async fn delete_staff_data(state: &AppState, staff_id: String) -> Result<String, String> {
        match staff::Entity::delete_by_id(staff_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok("Staff account deleted successfully".to_string())
                } else {
                    Err("Staff account not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting staff account: {}", err)),
        }
    }
}