use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(BroadcastMessage::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(BroadcastMessage::BroadcastMessageId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(BroadcastMessage::TargetAudience).string().not_null()) // "Customer" or "Staff"
                    .col(ColumnDef::new(BroadcastMessage::Content).text().not_null())
                    .col(ColumnDef::new(BroadcastMessage::Timestamp).timestamp().not_null()) // Use timestamp type
                    .col(ColumnDef::new(BroadcastMessage::Status).string().not_null()) // "Pending" or "Sent"
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(BroadcastMessage::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum BroadcastMessage {
    Table,
    BroadcastMessageId,
    TargetAudience,
    Content,
    Timestamp,
    Status,
}