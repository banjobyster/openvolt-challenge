/**
 * Event listener for the "fetchButton" click event. Fetches data from various APIs.
 *
 * @async
 * @function
 * @returns {void}
 * @throws {Error} Throws an error if data fetching or processing fails.
 */
document
    .getElementById("fetchButton")
    .addEventListener("click", async function () {
        try {
            // Get the selected meter_id and time period
            const meterId = document.getElementById("meterId").value;
            const timePeriod = document.getElementById("timePeriod").value;

            const [
                startDateCarbonIntensity,
                endDateCarbonIntensity,
                startDateOpenvolt,
                endDateOpenvolt,
            ] = parseDates(timePeriod);

            const loadingElement = document.getElementById("loading");
            loadingElement.style.display = "block";

            // Make concurrent API calls using Promise.all
            const [
                openvoltData,
                carbonIntensityData,
                generationMixData,
            ] = await Promise.all([
                fetchOpenvoltData(meterId, startDateOpenvolt, endDateOpenvolt),
                fetchCarbonIntensityData(
                    startDateCarbonIntensity,
                    endDateCarbonIntensity
                ),
                fetchGenerationMixData(
                    startDateCarbonIntensity,
                    endDateCarbonIntensity
                ),
            ]);

            // Store carbon emission intensity and percentage fuel mix for half hour intervals
            const carbonEmissionStore = {};
            for (const item of carbonIntensityData) {
                const key = item["from"].slice(0, 16);
                carbonEmissionStore[key] = { intensity: item.intensity.actual };
            }

            for (const mix of generationMixData) {
                const key = mix["from"].slice(0, 16);
                if (carbonEmissionStore[key]) {
                    carbonEmissionStore[key].generationmix = mix.generationmix;
                }
            }

            // Variables to store monthly energy consumed, carbon emission, and monthly fuel mix percentages
            let monthlyEnergyConsumed = 0;
            let monthlyCarbonEmission = 0;
            const monthlyFuelMix = {};

            // Traverse openvoltData and calculate energy consumption and carbon emission with fuel distribution
            for (const item of openvoltData) {
                monthlyEnergyConsumed += Number(item.consumption);
                const key = item["start_interval"].slice(0, 16);
                const intensityData = carbonEmissionStore[key];
                if (intensityData) {
                    const halfHourCarbonEmission =
                        Number(item.consumption * Number(intensityData.intensity)) / 1000;
                    monthlyCarbonEmission += halfHourCarbonEmission;

                    if (intensityData.generationmix) {
                        for (const mix of intensityData.generationmix) {
                            const fuel = mix.fuel;
                            const perc = Number(mix.perc) / 100;
                            if (!monthlyFuelMix[fuel]) {
                                monthlyFuelMix[fuel] = 0;
                            }
                            monthlyFuelMix[fuel] += perc * halfHourCarbonEmission;
                        }
                    }
                }
            }

            for (const fuel in monthlyFuelMix) {
                monthlyFuelMix[fuel] = (Number(monthlyFuelMix[fuel] / monthlyCarbonEmission) * 100).toFixed(2) + "%";
            }

            updateOutput(monthlyEnergyConsumed, monthlyCarbonEmission, monthlyFuelMix);
            loadingElement.style.display = "none";
        } catch (error) {
            alert("Error fetching and processing data: " + error);
        }
    });

/**
 * Parses the given time period to extract start and end dates.
 * @param {string} timePeriod - The time period in the format "YYYY-MM".
 * @returns {[string, string, string, string]} An array containing start and end dates for Openvolt and Carbon Intensity APIs.
 */
function parseDates(timePeriod) {
    const [year, month] = timePeriod.split("-");

    // Calculate the last day of the selected month
    const lastDay = new Date(year, month, 0).getDate();

    // Calculate start and end dates for Openvolt API using Date objects
    const startDateOpenvolt = `${year}-${month}-01T00:00:00Z`;
    const endDateOpenvolt = `${year}-${month}-${lastDay}T23:30:00Z`;

    // Create a Date object for the 1st day of next month
    const nextDayDate = new Date(year, month - 1, lastDay + 1);
    const nextDayYear = nextDayDate.getFullYear();
    const nextDayMonth = String(nextDayDate.getMonth() + 1).padStart(2, "0");
    const nextDay = String(nextDayDate.getDate()).padStart(2, "0");

    // Calculate start and end dates for Carbon Intensity API using Date objects
    const startDateCarbonIntensity = `${year}-${month}-01T00:30:00.000Z`;
    const endDateCarbonIntensity = `${nextDayYear}-${nextDayMonth}-${nextDay}T00:00:00.000Z`;

    return [
        startDateCarbonIntensity,
        endDateCarbonIntensity,
        startDateOpenvolt,
        endDateOpenvolt,
    ];
}

/**
 * Fetches data from the Openvolt API.
 *
 * @async
 * @function
 * @param {string} meterId - The meter ID.
 * @param {string} startDate - The start date in ISO 8601 format.
 * @param {string} endDate - The end date in ISO 8601 format.
 * @returns {Promise<object>} A promise that resolves to the fetched data or an error.
 * @throws {Error} Throws an error if data fetching or processing fails.
 */
async function fetchOpenvoltData(meterId, startDate, endDate) {
    const url = new URL("https://api.openvolt.com/v1/interval-data");
    url.searchParams.append("meter_id", meterId);
    url.searchParams.append("start_date", startDate);
    url.searchParams.append("end_date", endDate);
    url.searchParams.append("granularity", "hh");

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-api-key": "test-Z9EB05N-07FMA5B-PYFEE46-X4ECYAR",
            },
        });

        const responseData = await response.json();

        if (responseData.data) {
            return responseData.data;
        } else {
            throw new Error("Data not found in the response");
        }
    } catch (error) {
        throw new Error("Error fetching or processing data: " + error.message);
    }
}

/**
 * Fetches carbon intensity data from the Carbon Intensity API.
 *
 * @async
 * @function
 * @param {string} startDate - The start date in ISO 8601 format.
 * @param {string} endDate - The end date in ISO 8601 format.
 * @returns {Promise<object>} A promise that resolves to the fetched data or an error.
 * @throws {Error} Throws an error if data fetching or processing fails.
 */
async function fetchCarbonIntensityData(startDate, endDate) {
    try {
        const response = await fetch(
            `https://api.carbonintensity.org.uk/intensity/${startDate}/${endDate}`
        );
        const responseData = await response.json();

        if (responseData.data) {
            return responseData.data;
        } else {
            throw new Error("Data not found in the response");
        }
    } catch (error) {
        throw new Error("Error fetching or processing data: " + error.message);
    }
}

/**
 * Fetches generation data from the Carbon Intensity API.
 *
 * @async
 * @function
 * @param {string} startDate - The start date in ISO 8601 format.
 * @param {string} endDate - The end date in ISO 8601 format.
 * @returns {Promise<object>} A promise that resolves to the fetched data or an error.
 * @throws {Error} Throws an error if data fetching or processing fails.
 */
async function fetchGenerationMixData(startDate, endDate) {
    try {
        const response = await fetch(
            `https://api.carbonintensity.org.uk/generation/${startDate}/${endDate}`
        );
        const responseData = await response.json();

        if (responseData.data) {
            return responseData.data;
        } else {
            throw new Error("Data not found in the response");
        }
    } catch (error) {
        throw new Error("Error fetching or processing data: " + error.message);
    }
}

/**
 * Displays the output onto HTML in a formatted and colored JSON style.
 * @param {number} monthlyEnergyConsumed - The monthly energy consumed in kWh.
 * @param {number} monthlyCarbonEmission - The monthly carbon emission in kgs.
 * @param {Object} monthlyFuelMix - An object representing the monthly fuel mix percentages.
 */
function updateOutput(monthlyEnergyConsumed, monthlyCarbonEmission, monthlyFuelMix) {
    const jsonOutput = document.getElementById("jsonOutput");

    const outputData = {
        "Monthly Energy Consumed (kWh)": monthlyEnergyConsumed.toFixed(2) + " kWh",
        "Monthly Carbon Emission (kgs)": monthlyCarbonEmission.toFixed(2) + " kgs",
        "Monthly Fuel Mix (%)": monthlyFuelMix,
    };

    const formattedJson = JSON.stringify(outputData, null, 4);
    jsonOutput.innerHTML = formattedJson;
}
