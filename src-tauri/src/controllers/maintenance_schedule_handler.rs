// src-tauri/src/handler/maintenance_schedule_handler.rs

use chrono::NaiveDateTime;
use sea_orm::{ActiveModelTrait, ColumnTrait, Condition, EntityTrait, QueryFilter, QueryOrder, Set};
use entity::maintenance_schedule::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{ApiResponse, AppState};

pub struct MaintenanceScheduleHandler;

impl MaintenanceScheduleHandler {
    // View all maintenance schedules
    pub async fn view_maintenance_schedules(
        state: &AppState,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        match maintenance_schedule::Entity::find()
            .order_by_asc(maintenance_schedule::Column::StartDate)
            .all(&state.db)
            .await
        {
            Ok(maintenance_schedules) => Ok(ApiResponse::success(maintenance_schedules)),
            Err(err) => Err(format!("Error fetching maintenance schedules: {}", err)),
        }
    }

    // View maintenance schedules for a specific staff member
    pub async fn view_maintenance_schedule_by_staff(
        state: &AppState,
        staff_id: String,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        match maintenance_schedule::Entity::find()
            .filter(maintenance_schedule::Column::StaffId.eq(staff_id))
            .order_by_asc(maintenance_schedule::Column::StartDate)
            .all(&state.db)
            .await
        {
            Ok(maintenance_schedules) => Ok(ApiResponse::success(maintenance_schedules)),
            Err(err) => Err(format!("Error fetching maintenance schedules for staff: {}", err)),
        }
    }


    // Save maintenance schedule data (create new schedule)
    pub async fn save_maintenance_schedule_data(
        state: &AppState,
        ride_id: String,
        staff_id: String,
        description: Option<String>,
        start_date: String,
        end_date: String,
        status: String,
    ) -> Result<ApiResponse<String>, String> {
        // **Check if the assigned staff already has an active schedule**
        let active_statuses = vec!["Pending".to_string(), "Ongoing".to_string()];

        let existing_active_schedule = maintenance_schedule::Entity::find()
            .filter(
                Condition::all() // Combine filters
                    .add(maintenance_schedule::Column::StaffId.eq(staff_id.clone()))
                    .add(maintenance_schedule::Column::Status.is_in(active_statuses))
            )
            .one(&state.db)
            .await
            .map_err(|e| format!("Database error checking existing schedule: {}", e))?;

        if existing_active_schedule.is_some() {
            return Err("This staff member already has an active (Pending or Ongoing) maintenance task.".to_string());
        }

        // If no active schedule, proceed with creation
        let maintenance_task_id = Uuid::new_v4().to_string();
        // Parse the custom "YYYY-MM-DDTHH:MM" format
        let parsed_start_date = NaiveDateTime::parse_from_str(&start_date, "%Y-%m-%dT%H:%M")
            .map_err(|e| format!("Invalid start_date format: {}", e))?;
        let parsed_end_date = NaiveDateTime::parse_from_str(&end_date, "%Y-%m-%dT%H:%M")
            .map_err(|e| format!("Invalid end_date format: {}", e))?;


        let new_maintenance_schedule = maintenance_schedule::ActiveModel {
            maintenance_task_id: Set(maintenance_task_id),
            ride_id: Set(ride_id),
            staff_id: Set(staff_id),
            description: Set(description),
            start_date: Set(parsed_start_date),
            end_date: Set(parsed_end_date),
            status: Set(status),
            ..Default::default()
        };

        match maintenance_schedule::Entity::insert(new_maintenance_schedule).exec(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Maintenance schedule created successfully".to_string())),
            Err(err) => Err(format!("Error creating maintenance schedule: {}", err)),
        }
    }

    // Update maintenance schedule data
    pub async fn update_maintenance_schedule_data(
        state: &AppState,
        maintenance_task_id: String,
        ride_id: Option<String>,
        staff_id: Option<String>,
        description: Option<Option<String>>, // Option<Option<String>> for nullable description
        start_date: Option<String>,
        end_date: Option<String>,
        status: Option<String>,
    ) -> Result<ApiResponse<String>, String> {
        let maintenance_schedule_record = match maintenance_schedule::Entity::find_by_id(maintenance_task_id).one(&state.db).await {
            Ok(Some(schedule)) => schedule,
            Ok(None) => return Err("Maintenance schedule not found".to_string()),
            Err(err) => return Err(format!("Error fetching maintenance schedule: {}", err)),
        };

        let mut active_maintenance_schedule: maintenance_schedule::ActiveModel = maintenance_schedule_record.into();

        if let Some(new_ride_id) = ride_id {
            active_maintenance_schedule.ride_id = Set(new_ride_id);
        }
        if let Some(new_staff_id) = staff_id {
            active_maintenance_schedule.staff_id = Set(new_staff_id);
        }
        if let Some(new_description) = description {
            active_maintenance_schedule.description = Set(new_description);
        }
        if let Some(start_date_str) = start_date {
            let parsed_start_date = NaiveDateTime::parse_from_str(&start_date_str, "%Y-%m-%dT%H:%M")
            .map_err(|e| format!("Invalid start_date format: {}", e))?;
            active_maintenance_schedule.start_date = Set(parsed_start_date);
        }
        if let Some(end_date_str) = end_date {
            let parsed_end_date = NaiveDateTime::parse_from_str(&end_date_str, "%Y-%m-%dT%H:%M")
            .map_err(|e| format!("Invalid end_date format: {}", e))?;
            active_maintenance_schedule.end_date = Set(parsed_end_date);
        }
        if let Some(new_status) = status {
            active_maintenance_schedule.status = Set(new_status);
        }


        match active_maintenance_schedule.update(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Maintenance schedule updated successfully".to_string())),
            Err(err) => Err(format!("Error updating maintenance schedule: {}", err)),
        }
    }

    // Delete maintenance schedule data
    pub async fn delete_maintenance_schedule_data(state: &AppState, maintenance_task_id: String) -> Result<String, String> {
        match maintenance_schedule::Entity::delete_by_id(maintenance_task_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok("Maintenance schedule deleted successfully".to_string())
                } else {
                    Err("Maintenance schedule not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting maintenance schedule: {}", err)),
        }
    }
}