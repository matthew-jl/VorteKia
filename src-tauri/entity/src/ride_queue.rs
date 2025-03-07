use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "ride_queue")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub ride_queue_id: String,
    pub ride_id: String, // Foreign key to ride
    pub joined_at: DateTime, // Timestamp for when the customer joined
    pub customer_id: String, // Foreign key to customer
    pub queue_position: Decimal, // Float for queue position
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(belongs_to = "super::ride::Entity", from = "Column::RideId", to = "super::ride::Column::RideId")]
    Ride,
    #[sea_orm(belongs_to = "super::customer::Entity", from = "Column::CustomerId", to = "super::customer::Column::CustomerId")]
    Customer,
}

impl Related<super::ride::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Ride.def()
    }
}

impl Related<super::customer::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Customer.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}