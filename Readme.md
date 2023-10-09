# Openvolt Challenge

The Openvolt Challenge is a web application that provides insights into monthly energy consumption, carbon emissions, and the monthly fuel mix used for electricity generation. It accomplishes this by fetching and processing data from various APIs.

## How to Use

1. Access the web application by visiting [Openvolt Challenge](https://banjobyster.github.io/openvolt-challenge/).

2. Fill in the following details:

   - **Meter ID**: Enter your meter ID.
   - **Month**: Select the desired month.

3. Click the "Fetch Data" button to initiate the data retrieval process.

4. While waiting for the response, the application will display a loading indicator.

5. Once the data is fetched and processed, the results will be presented in a user-friendly JSON format, showcasing the monthly energy consumption, carbon emissions, and the breakdown of the monthly fuel mix used for electricity generation.

This web application simplifies the task of monitoring energy-related metrics and provides valuable information for informed decision-making.

**NOTE** : Please note that default values have been pre-filled based on the challenge's requirements, but you can customize the inputs as needed to explore different scenarios.

## Calculations

This section provides details on the calculations used to determine the following metrics:

1. **Monthly Energy Consumed (kWh):**

   The monthly energy consumed by the building is calculated by summing the energy consumption values obtained from half-hourly readings. Each half-hour reading represents the electricity consumed during a specific period.

   - For each half-hour reading, the energy consumption is recorded in kilowatt-hours (kWh).
   - The monthly energy consumption is obtained by adding up all the half-hour consumption values for the respective month.

2. **Monthly CO2 Emissions (kgs):**

   The monthly CO2 emissions associated with electricity generation are calculated based on the carbon intensity of electricity consumed. Carbon intensity represents the amount of CO2 emissions per unit of electricity generated.

   - Carbon intensity data is collected from the Carbon Intensity API.
   - For each half-hour reading, the carbon intensity (in grams of CO2 per kWh) is recorded.
   - The half-hourly carbon emissions are calculated by multiplying the energy consumption (in kWh) for that period by the corresponding carbon intensity value (in grams per kWh).
   - The monthly CO2 emissions are obtained by summing all the half-hourly emissions values for the respective month. The result is in kilograms (kgs).

3. **Monthly % of Fuel Mix (wind/solar/nuclear/coal/etc):**

   The monthly percentage of fuel mix used for electricity generation is calculated based on the composition of fuels used during each half-hour period.

   - Fuel mix data is collected from the Generation Mix API.
   - For each half-hour reading, information about the mix of fuels used (e.g., wind, solar, nuclear, coal) is recorded, along with the percentage of each fuel in the mix.
   - To calculate the weighted average of each fuel's contribution, the following steps are performed:
     - For each half-hour period, the carbon emissions (calculated in step 2) associated with each fuel type are determined based on their respective percentages in the mix.
     - These carbon emissions are added to the cumulative emissions for each fuel type.
     - At the end of the month, the total emissions for each fuel type are divided by the total monthly CO2 emissions to calculate the percentage contribution of each fuel type to the overall emissions.
   - The result is a breakdown of the monthly fuel mix as percentages.

