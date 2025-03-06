use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "menu_item")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub menu_item_id: String,
    pub photo: Option<String>, // Option because it can be NULL in DB
    pub name: String,
    pub price: String, // Price as String
    pub restaurant_id: String, // Foreign Key
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(belongs_to = "super::restaurant::Entity", from="Column::RestaurantId", to="super::restaurant::Column::RestaurantId")] // Define relation to Restaurant entity
    Restaurant,
}

impl Related<super::restaurant::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Restaurant.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}