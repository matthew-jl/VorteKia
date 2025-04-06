// src-tauri/src/entity/maintenance_schedule.rs

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "maintenance_schedule")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub maintenance_task_id: String,
    pub ride_id: String,
    pub staff_id: String,
    pub description: Option<String>,
    pub start_date: DateTime,
    pub end_date: DateTime,
    pub status: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::ride::Entity",
        from = "Column::RideId",
        to = "super::ride::Column::RideId"
    )]
    Ride,
    #[sea_orm(
        belongs_to = "super::staff::Entity",
        from = "Column::StaffId",
        to = "super::staff::Column::StaffId"
    )]
    Staff,
}

impl Related<super::ride::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Ride.def()
    }
}

impl Related<super::staff::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Staff.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}