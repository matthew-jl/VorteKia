use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(LostAndFoundItemsLog::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(LostAndFoundItemsLog::LogId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(LostAndFoundItemsLog::Image).string()) // Nullable
                    .col(ColumnDef::new(LostAndFoundItemsLog::Name).string().not_null())
                    .col(ColumnDef::new(LostAndFoundItemsLog::Type).string().not_null())
                    .col(ColumnDef::new(LostAndFoundItemsLog::Color).string().not_null())
                    .col(ColumnDef::new(LostAndFoundItemsLog::LastSeenLocation).string()) // Nullable
                    .col(ColumnDef::new(LostAndFoundItemsLog::Finder).string()) // Nullable
                    .col(ColumnDef::new(LostAndFoundItemsLog::Owner).string()) // Nullable
                    .col(ColumnDef::new(LostAndFoundItemsLog::FoundLocation).string()) // Nullable
                    .col(
                        ColumnDef::new(LostAndFoundItemsLog::Timestamp)
                            .timestamp()
                            .not_null(),
                    )
                    .col(ColumnDef::new(LostAndFoundItemsLog::Status).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(LostAndFoundItemsLog::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum LostAndFoundItemsLog {
    Table,
    LogId,
    Image,
    Name,
    Type,
    Color,
    LastSeenLocation,
    Finder,
    Owner,
    FoundLocation,
    Timestamp,
    Status,
}