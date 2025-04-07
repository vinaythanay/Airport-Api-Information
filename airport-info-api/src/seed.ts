import "reflect-metadata";
import * as XLSX from "xlsx";
import * as fs from "fs";
import { AppDataSource } from "./database/ormconfig";
import { Airport } from "./entities/Airport";
import { City } from "./entities/City";
import { Country } from "./entities/Country";

interface AirportData {
  icao_code: string;
  iata_code: string;
  name: string;
  type: string;
  latitude_deg: number;
  longitude_deg: number;
  elevation_ft: number;
  city_id: number;
  country_id: number;
}

async function importAirportData(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Excel file not found at path: ${filePath}`);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<AirportData>(sheet);

  console.log(`📄 Found ${rows.length} records in Excel file`);

  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    for (const row of rows) {
      if (!row.iata_code || !row.name || !row.city_id || !row.country_id) {
        console.warn(`⚠️ Skipping incomplete row: ${JSON.stringify(row)}`);
        continue;
      }

      const city = await queryRunner.manager.findOne(City, {
        where: { id: row.city_id, country: { id: row.country_id } },
        relations: ["country"],
      });

      if (!city) {
        console.warn(`⚠️ City not found for city_id=${row.city_id}, country_id=${row.country_id}`);
        continue;
      }

      let airport = await queryRunner.manager.findOne(Airport, {
        where: { iata_code: row.iata_code },
      });

      if (!airport) {
        airport = new Airport();
        airport.icao_code = row.icao_code;
        airport.iata_code = row.iata_code;
        airport.name = row.name;
        airport.type = row.type;
        airport.latitude_deg = row.latitude_deg;
        airport.longitude_deg = row.longitude_deg;
        airport.elevation_ft = row.elevation_ft;
        airport.city = city;

        await queryRunner.manager.save(airport);
        console.log(`✅ Inserted airport: ${airport.name} (${airport.iata_code})`);
      } else {
        console.log(`ℹ️ Airport already exists: ${row.iata_code}`);
      }
    }

    await queryRunner.commitTransaction();
    console.log("🎉 All airport data imported successfully!");
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("❌ Error during transaction:", error);
  } finally {
    await queryRunner.release();
  }
}

importAirportData("./database.xlsx");
