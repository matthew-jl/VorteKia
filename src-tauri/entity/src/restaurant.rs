use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "restaurant")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub restaurant_id: String,
    pub name: String,
    pub photo: Option<String>, // Option because it can be NULL in DB
    pub opening_time: Time, // Use Time type
    pub closing_time: Time, // Use Time type
    pub cuisine_type: String,
    pub location: Option<String>, // Option because it can be NULL in DB
    pub status: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::menu_item::Entity")] // Define relation to MenuItem entity
    MenuItem,
}

impl Related<super::menu_item::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MenuItem.def()
    }
}


impl ActiveModelBehavior for ActiveModel {}