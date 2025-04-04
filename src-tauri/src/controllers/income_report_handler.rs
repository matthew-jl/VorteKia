use chrono::{DateTime, Datelike, Duration, TimeZone, Utc};
use std::collections::HashMap;
// use std::str::FromStr;
use rust_decimal::Decimal; // For Decimal handling if needed
use rust_decimal::prelude::{FromPrimitive, FromStr, ToPrimitive};

use crate::{ApiResponse, AppState};
use crate::controllers::{
    order_restaurant_handler::OrderRestaurantHandler,
    order_souvenir_handler::OrderSouvenirHandler,
    ride_queue_handler::RideQueueHandler,
    restaurant_handler::RestaurantHandler, // For restaurant names
    menu_item_handler::MenuItemHandler, // For menu item prices
    store_handler::StoreHandler, // For store names
    souvenir_handler::SouvenirHandler, // For souvenir prices
    ride_handler::RideHandler, // For ride names and prices
};
use entity::{
    order_restaurant, order_souvenir, ride_queue,
    restaurant, menu_item, store, souvenir, ride
};
use serde::Serialize;

// Define the Report Structs (matching frontend)
#[derive(Serialize, Debug)]
pub struct RestaurantIncome {
  restaurant_id: String,
  restaurant_name: String,
  total_income: f64, // Use f64 for calculations, format later
  order_count: i64,
  items_sold: i64,
}

#[derive(Serialize, Debug)]
pub struct StoreIncome {
  store_id: String,
  store_name: String,
  total_income: f64,
  order_count: i64,
  items_sold: i64,
}

#[derive(Serialize, Debug)]
pub struct RideIncome {
  ride_id: String,
  ride_name: String,
  total_income: f64,
  ticket_count: i64,
}

#[derive(Serialize, Debug)]
pub struct IncomeReport {
  consumption: ConsumptionReport,
  marketing: MarketingReport,
  operations: OperationsReport,
  grand_total: f64,
  period: String,
}

#[derive(Serialize, Debug)]
pub struct ConsumptionReport {
    total: f64,
    restaurants: Vec<RestaurantIncome>,
}

#[derive(Serialize, Debug)]
pub struct MarketingReport {
    total: f64,
    stores: Vec<StoreIncome>,
}

#[derive(Serialize, Debug)]
pub struct OperationsReport {
    total: f64,
    rides: Vec<RideIncome>,
}

pub struct IncomeReportHandler;

impl IncomeReportHandler {

    pub async fn generate_income_report(
        state: &AppState,
        period: String, // "day", "week", "month"
    ) -> Result<ApiResponse<IncomeReport>, String> {
        let now = Utc::now();
        let (start_time, end_time, period_str) = match period.as_str() {
            "day" => {
                let start = now.date_naive().and_hms_opt(0, 0, 0).unwrap();
                let end = start + Duration::days(1);
                (
                    Utc.from_utc_datetime(&start),
                    Utc.from_utc_datetime(&end),
                    now.format("%Y-%m-%d").to_string()
                )
            },
            "week" => {
                let days_since_monday = now.weekday().num_days_from_monday();
                let start = (now - Duration::days(days_since_monday as i64)).date_naive().and_hms_opt(0, 0, 0).unwrap();
                let end = start + Duration::weeks(1);
                (
                    Utc.from_utc_datetime(&start),
                    Utc.from_utc_datetime(&end),
                    format!("Week starting {}", start.format("%Y-%m-%d"))
                )
            },
            "month" => {
                let start = Utc.with_ymd_and_hms(now.year(), now.month(), 1, 0, 0, 0).unwrap();
                let next_month_start = if now.month() == 12 {
                    Utc.with_ymd_and_hms(now.year() + 1, 1, 1, 0, 0, 0).unwrap()
                } else {
                    Utc.with_ymd_and_hms(now.year(), now.month() + 1, 1, 0, 0, 0).unwrap()
                };
                (
                    start,
                    next_month_start,
                    start.format("%Y-%m").to_string()
                )
            },
            _ => return Err("Invalid time period specified. Use 'day', 'week', or 'month'".to_string()),
        };

        // --- Fetch Data Sequentially ---
        let restaurant_orders_res = OrderRestaurantHandler::get_restaurant_orders_in_range(state, start_time, end_time).await;
        let souvenir_orders_res = OrderSouvenirHandler::get_souvenir_orders_in_range(state, start_time, end_time).await;
        let ride_queues_res = RideQueueHandler::get_ride_queues_in_range(state, start_time, end_time).await;
        let all_restaurants_res = RestaurantHandler::view_restaurants(state).await;
        let all_menu_items_res = MenuItemHandler::view_menu_items(state, None).await;
        let all_stores_res = StoreHandler::view_stores(state).await;
        let all_souvenirs_res = SouvenirHandler::view_souvenirs(state, None).await;
        let all_rides_res = RideHandler::view_rides(state).await;

        // --- Correctly Extract Data (same as before) ---
        let restaurant_orders = match restaurant_orders_res? {
            ApiResponse::Success { data, .. } => data,
            ApiResponse::Error { message, .. } => return Err(message),
        };
        // ... (extract other data similarly) ...
         let souvenir_orders = match souvenir_orders_res? {
            ApiResponse::Success { data, .. } => data,
            ApiResponse::Error { message, .. } => return Err(message),
        };
        let ride_queues = match ride_queues_res? {
            ApiResponse::Success { data, .. } => data,
            ApiResponse::Error { message, .. } => return Err(message),
        };
         let all_restaurants = match all_restaurants_res? {
             ApiResponse::Success { data, .. } => data
                 .into_iter().map(|r| (r.restaurant_id.clone(), r.name.clone())).collect::<HashMap<_,_>>(),
             ApiResponse::Error { message, .. } => return Err(message),
         };
        let all_menu_items = match all_menu_items_res? {
             ApiResponse::Success { data, .. } => data
                 .into_iter().map(|m| (m.menu_item_id.clone(), Decimal::from_str(&m.price).unwrap_or_default())).collect::<HashMap<_,_>>(),
             ApiResponse::Error { message, .. } => return Err(message),
         };
        let all_stores = match all_stores_res? {
             ApiResponse::Success { data, .. } => data
                 .into_iter().map(|s| (s.store_id.clone(), s.name.clone())).collect::<HashMap<_,_>>(),
             ApiResponse::Error { message, .. } => return Err(message),
         };
        let all_souvenirs = match all_souvenirs_res? {
             ApiResponse::Success { data, .. } => data
                 .into_iter().map(|s| (s.souvenir_id.clone(), s.price)).collect::<HashMap<_,_>>(),
             ApiResponse::Error { message, .. } => return Err(message),
         };
        let all_rides = match all_rides_res? {
             ApiResponse::Success { data, .. } => data
                 .into_iter().map(|r| (r.ride_id.clone(), (r.name.clone(), Decimal::from_str(&r.price).unwrap_or_default()))).collect::<HashMap<_,_>>(),
             ApiResponse::Error { message, .. } => return Err(message),
         };

        // --- Process Consumption Data ---
        let mut restaurant_income_map: HashMap<String, RestaurantIncome> = HashMap::new();
        for order in &restaurant_orders {
            let item_price = *all_menu_items.get(&order.menu_item_id).unwrap_or(&Decimal::ZERO);
            let order_value = item_price * Decimal::from_i32(order.quantity).unwrap_or_default();
            let restaurant_name = all_restaurants.get(&order.restaurant_id).cloned().unwrap_or_else(|| "Unknown Restaurant".to_string());

            let entry = restaurant_income_map
                .entry(order.restaurant_id.clone())
                .or_insert(RestaurantIncome {
                    restaurant_id: order.restaurant_id.clone(),
                    restaurant_name: restaurant_name.clone(),
                    total_income: 0.0,
                    order_count: 0,
                    items_sold: 0,
                });

            entry.total_income += order_value.to_f64().unwrap_or(0.0);
            entry.order_count += 1;
            entry.items_sold += order.quantity as i64;
        }
        let consumption_total = restaurant_income_map.values().map(|r| r.total_income).sum();
        let consumption_report = ConsumptionReport {
            total: consumption_total,
            restaurants: restaurant_income_map.into_values().collect(),
        };

        // --- Process Marketing Data ---
        let mut store_income_map: HashMap<String, StoreIncome> = HashMap::new();
        for order in &souvenir_orders {
            let item_price = *all_souvenirs.get(&order.souvenir_id).unwrap_or(&Decimal::ZERO);
            let order_value = item_price * Decimal::from_i32(order.quantity).unwrap_or_default();
            let store_name = all_stores.get(&order.store_id).cloned().unwrap_or_else(|| "Unknown Store".to_string());

            let entry = store_income_map
                .entry(order.store_id.clone())
                .or_insert(StoreIncome {
                    store_id: order.store_id.clone(),
                    store_name: store_name.clone(),
                    total_income: 0.0,
                    order_count: 0,
                    items_sold: 0,
                });

            entry.total_income += order_value.to_f64().unwrap_or(0.0);
            entry.order_count += 1;
            entry.items_sold += order.quantity as i64;
        }
        let marketing_total = store_income_map.values().map(|s| s.total_income).sum();
        let marketing_report = MarketingReport {
            total: marketing_total,
            stores: store_income_map.into_values().collect(),
        };

        // --- Process Operations Data ---
        let mut ride_income_map: HashMap<String, RideIncome> = HashMap::new();
        for queue_entry in &ride_queues {
            if let Some((ride_name, ride_price)) = all_rides.get(&queue_entry.ride_id) {
                let entry = ride_income_map
                    .entry(queue_entry.ride_id.clone())
                    .or_insert(RideIncome {
                        ride_id: queue_entry.ride_id.clone(),
                        ride_name: ride_name.clone(),
                        total_income: 0.0,
                        ticket_count: 0,
                    });
                entry.total_income += ride_price.to_f64().unwrap_or(0.0);
                entry.ticket_count += 1;
            }
        }
        let operations_total = ride_income_map.values().map(|r| r.total_income).sum();
        let operations_report = OperationsReport {
            total: operations_total,
            rides: ride_income_map.into_values().collect(),
        };

        // --- Combine Reports ---
        let grand_total = consumption_total + marketing_total + operations_total;

        let final_report = IncomeReport {
            consumption: consumption_report,
            marketing: marketing_report,
            operations: operations_report,
            grand_total,
            period: period_str,
        };

        Ok(ApiResponse::success(final_report))
    }
}