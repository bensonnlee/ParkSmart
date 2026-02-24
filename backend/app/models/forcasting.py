import pandas as pd
import numpy as np
from prophet import Prophet
import warnings

# Mute Prophet's informational messages for a clean output
warnings.filterwarnings("ignore")

def predict_parking_availability(lot_name, date_str, time_str):
    """
    Calculates the forecasted free spaces and the lower bound for a given lot and time.
    
    Returns:
        tuple: (forecasted_spaces, lower_bound_spaces)
    """
    # 1. Load the historical data file
    df = pd.read_csv('parking_snapshots_rows.csv')
    
    # 2. Filter for the requested lot
    lot_df = df[df['lot_name'] == lot_name].copy()
    if lot_df.empty:
        raise ValueError(f"No data found for lot: {lot_name}")

    # 3. Preprocess for Prophet (Removing timezone and renaming columns)
    prophet_df = lot_df[['collected_at', 'free_spaces']].rename(
        columns={'collected_at': 'ds', 'free_spaces': 'y'}
    )
    prophet_df['ds'] = pd.to_datetime(prophet_df['ds']).dt.tz_localize(None)

    # 4. Capacity Logic (Specific to your notebook's requirements)
    if lot_name == 'lot_30':
        capacity = 2143 
    else:
        # Dynamically set capacity to the maximum observed free spaces for other lots
        capacity = prophet_df['y'].max()
    
    prophet_df['cap'] = capacity

    # 5. Model Configuration (Exact parameters from your provided code)
    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=True,
        daily_seasonality=True,
        growth='logistic',
        changepoint_prior_scale=0.1,
        seasonality_prior_scale=5
    )
    
    model.fit(prophet_df)

    # 6. Forecast for the specific timestamp requested by the user
    target_ts = pd.to_datetime(f"{date_str} {time_str}")
    future = pd.DataFrame({'ds': [target_ts]})
    future['cap'] = capacity
    
    forecast = model.predict(future)

    # 7. Extract and Clip values (Ensuring non-negative results)
    yhat = max(0, forecast['yhat'].iloc[0])
    yhat_lower = max(0, forecast['yhat_lower'].iloc[0])

    # Returning as integers
    return int(round(yhat)), int(round(yhat_lower))

# --- Main Interaction Script ---
if __name__ == "__main__":
    print("--- Future Parking Availability Forecaster ---")
    lot = input("Enter Parking Lot: ")
    date = input("Enter Date (YYYY-MM-DD): ")
    time = input("Enter Time (HH:MM): ")

    try:
        # The function returns the values; the print statement is only in this main block
        forecasted, lower = predict_parking_availability(lot, date, time)
        
        print(f"\nResults for {lot} on {date} at {time}:")
        print(f"Forecasted Free Spaces: {forecasted}")
        print(f"Lower Bound (Conservative Estimate): {lower}")
        
    except Exception as e:
        print(f"Error: {e}")