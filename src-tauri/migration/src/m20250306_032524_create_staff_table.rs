use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Staff::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Staff::StaffId).string().not_null().primary_key())
                    .col(ColumnDef::new(Staff::Email).string().not_null().unique_key()) // Added unique constraint for email
                    .col(ColumnDef::new(Staff::PasswordHash).string().not_null())
                    .col(ColumnDef::new(Staff::Name).string().not_null())
                    .col(ColumnDef::new(Staff::Role).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Staff::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
pub enum Staff {
    Table,
    StaffId,
    Email,
    PasswordHash,
    Name,
    Role,
}