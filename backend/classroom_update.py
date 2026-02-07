import pandas as pd
df = pd.read_csv("Locations - Sheet1.csv")
kept_cols = ["Name", "Type", "Coords", "latitude", "longitude", "Short"]
df = df.loc[:, kept_cols]

is_parking_lot = df["Type"].str.contains(r"parking\s*lot|^lot\b", case=False, na=False)
is_building = df["Type"].str.contains(r"Building", case=False, na=False) 
is_dining = df["Type"].str.contains("Dining", case=False, na=False)

df["Structure"] = df["Type"]
df.loc[is_parking_lot, "Structure"] = "Parking Lot"
df.loc[is_building, "Structure"] = "Classroom"
df.loc[is_dining, "Structure"] = "Dining/Retail"

print(df.head())

df.to_csv("Locations_updated.csv", index=False, float_format="%.17f")