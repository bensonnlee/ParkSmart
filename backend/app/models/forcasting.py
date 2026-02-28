import pandas as pd
import numpy as np
from prophet import Prophet
import warnings

warnings.filterwarnings("ignore")

#Primary function:
def predict_parking_availability(lot_name, date_str, time_str):
    df = pd.read_csv('parking_snapshots_rows.csv') #Just read the most updated file for full accuracy.
    
    lot_df = df[df['lot_name'] == lot_name].copy()
    if lot_df.empty:
        raise ValueError(f"No data found for lot: {lot_name}")

    #Extracting the date and time:
    prophet_df = lot_df[['collected_at', 'free_spaces']].rename(
        columns={'collected_at': 'ds', 'free_spaces': 'y'}
    )
    prophet_df['ds'] = pd.to_datetime(prophet_df['ds']).dt.tz_localize(None)

    if lot_name == 'lot_30':
        capacity = 2143 
    else:
        capacity = prophet_df['y'].max()
    
    prophet_df['cap'] = capacity

    #Prophet parameters:
    model = Prophet(
        yearly_seasonality=False, #Not enough data to map yearly trends.
        weekly_seasonality=True,
        daily_seasonality=True,
        growth='logistic',
        changepoint_prior_scale=0.1,
        seasonality_prior_scale=5
    )
    
    model.fit(prophet_df)

    target_ts = pd.to_datetime(f"{date_str} {time_str}")
    future = pd.DataFrame({'ds': [target_ts]})
    future['cap'] = capacity
    
    forecast = model.predict(future)

    yhat = max(0, forecast['yhat'].iloc[0])
    yhat_lower = max(0, forecast['yhat_lower'].iloc[0])

    return int(round(yhat)), int(round(yhat_lower)) #Returning the average and lower forcasts <-- Might change.

if __name__ == "__main__":
    lot = input("Enter Parking Lot: ")
    date = input("Enter Date (YYYY-MM-DD): ")
    time = input("Enter Time (HH:MM): ")

    try:
        forecasted, lower = predict_parking_availability(lot, date, time)
        
    except Exception as e:
        print(f"Error: {e}")