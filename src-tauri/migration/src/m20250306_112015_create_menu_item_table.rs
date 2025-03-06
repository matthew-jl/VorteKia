use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250306_111959_create_restaurant_table::Restaurant;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(MenuItem::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(MenuItem::MenuItemId).string().not_null().primary_key())
                    .col(ColumnDef::new(MenuItem::Photo).string()) // Photo URL, can be NULL
                    .col(ColumnDef::new(MenuItem::Name).string().not_null())
                    .col(ColumnDef::new(MenuItem::Price).string().not_null()) // Price as String
                    .col(ColumnDef::new(MenuItem::RestaurantId).string().not_null()) // Foreign Key Column
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-menu_item-restaurant_id") // Optional FK name
                            .from(MenuItem::Table, MenuItem::RestaurantId)
                            .to(Restaurant::Table, Restaurant::RestaurantId)
                            .on_delete(ForeignKeyAction::Cascade) // Define delete behavior (e.g., Cascade)
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(MenuItem::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum MenuItem {
    Table,
    MenuItemId,
    Photo,
    Name,
    Price,
    RestaurantId,
}