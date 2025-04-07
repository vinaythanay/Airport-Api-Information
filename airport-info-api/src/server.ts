import "reflect-metadata";
import { AppDataSource } from "./database/ormconfig";
import { Airport } from "./entities/Airport";
const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/api/airport/:iata_code", async (req, res) => {
    try {
        const iata_code = req.params.iata_code.toUpperCase();

        const airport = await AppDataSource.getRepository(Airport).findOne({
            where: { iata_code },
            relations: ["city", "city.country"]
        });

        if (!airport) {
            return res.status(404).json({ error: "Airport not found" });
        }

        res.json({
            airport: {
                id: airport.id,
                icao_code: airport.icao_code,
                iata_code: airport.iata_code,
                name: airport.name,
                type: airport.type,
                latitude_deg: airport.latitude_deg,
                longitude_deg: airport.longitude_deg,
                elevation_ft: airport.elevation_ft,
                address: {
                    city: airport.city ? {
                        id: airport.city.id,
                        name: airport.city.name,
                        is_active: airport.city.is_active,
                        lat: airport.city.lat,
                        long: airport.city.long,
                        country_id: airport.city.country?.id // Add manually here if needed in output
                    } : null,
                    country: airport.city?.country ? {
                        id: airport.city.country.id,
                        name: airport.city.country.name,
                        country_code_two: airport.city.country.country_code_two,
                        country_code_three: airport.city.country.country_code_three,
                        mobile_code: airport.city.country.mobile_code,
                        continent_id: airport.city.country.continent_id
                    } : null
                }
            }
        });
    } catch (error) {
        console.error("❌ Error fetching airport data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Initialize database and start server
AppDataSource.initialize()
    .then(() => {
        console.log("✅ Database Connected");
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Database Connection Failed:", error);
    });
