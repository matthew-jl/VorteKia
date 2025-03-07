use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "ride")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub ride_id: String,
    pub status: String,
    pub name: String,
    pub price: String,
    pub location: String,
    pub staff_id: String,
    pub photo: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::ride_queue::Entity")]
    RideQueue,
}

impl Related<super::ride_queue::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RideQueue.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}