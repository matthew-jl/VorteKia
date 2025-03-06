use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Restaurant::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Restaurant::RestaurantId).string().not_null().primary_key())
                    .col(ColumnDef::new(Restaurant::Name).string().not_null())
                    .col(ColumnDef::new(Restaurant::Photo).string()) // Photo URL, can be NULL
                    .col(ColumnDef::new(Restaurant::OpeningTime).time().not_null())
                    .col(ColumnDef::new(Restaurant::ClosingTime).time().not_null())
                    .col(ColumnDef::new(Restaurant::CuisineType).string().not_null())
                    .col(ColumnDef::new(Restaurant::Location).string()) // Location description, can be NULL
                    .col(ColumnDef::new(Restaurant::Status).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Restaurant::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Restaurant {
    Table,
    RestaurantId,
    Name,
    Photo,
    OpeningTime,
    ClosingTime,
    CuisineType,
    Location,
    Status,
}