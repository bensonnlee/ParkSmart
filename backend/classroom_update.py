import pandas as pd
df = pd.read_csv("Locations - Sheet1.csv")
kept_cols = ["Name", "Type", "Coords", "latitude", "longitude", "Short"]
df = df.loc[:, kept_cols]

is_parking_lot = df["Type"].str.contains(r"parking\s*lot|^lot\b", case=False, na=False)
is_building = df["Type"].str.contains(r"Building", case=False, na=False) 
df["Structure"] = df["Type"]
df.loc[is_parking_lot, "Structure"] = "Parking Lot"
df.loc[is_building, "Structure"] = "Classroom"

print(df.head())