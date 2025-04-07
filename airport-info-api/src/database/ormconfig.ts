import "reflect-metadata";
import { DataSource } from "typeorm";
import { Airport } from "../entities/Airport";
import { City } from "../entities/City";
import { Country } from "../entities/Country";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "airport.db",
    entities: [Airport, City, Country],
    synchronize: true,
    logging: false,
});
