import "reflect-metadata";
import * as XLSX from "xlsx";
import * as fs from 'fs';
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
  city_name: string;
  country_id: number;
  country_code_two: string;
  country_code_three: string;
  mobile_code: number;
  continent_id: number;
  city_lat: number;
  city_long: number;
}

export async function importAirportDataFromExcel(filePath: string): Promise<void> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Excel file not found at path: ${filePath}`);
      return;
    }

    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<AirportData>(worksheet);

    console.log(`Found ${data.length} airport records in Excel file`);

    // Initialize database connection
    await AppDataSource.initialize();

    // Start a transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Process the data
      for (const row of data) {
        // Check for required fields
        if (!row.icao_code || !row.iata_code || !row.name || !row.country_id) {
          console.warn(`Skipping incomplete row: ${JSON.stringify(row)}`);
          continue;
        }

        // Find or create country
        let country = await queryRunner.manager.findOne(Country, {
          where: {
            country_code_two: row.country_code_two
          }
        });

        if (!country) {
          country = new Country();
          country.id = row.country_id;
          country.country_code_two = row.country_code_two;
          country.country_code_three = row.country_code_three;
          country.mobile_code = row.mobile_code || 0;
          country.continent_id = row.continent_id || 0;
          country = await queryRunner.manager.save(country);
          console.log(`Created new country: ${country.id}`);
        }

        // Find or create city
        let city = await queryRunner.manager.findOne(City, {
          where: {
            id: row.city_id,
            country: { id: country.id }
          },
          relations: ['country']
        });

        if (!city) {
          city = new City();
          city.id = row.city_id;
          city.name = row.city_name;
          city.country = country;
          city.is_active = true;
          city.lat = row.city_lat || 0;
          city.long = row.city_long || 0;
          city = await queryRunner.manager.save(city);
          console.log(`Created new city: ${city.name}`);
        }

        // Find or create airport
        let airport = await queryRunner.manager.findOne(Airport, {
          where: { iata_code: row.iata_code }
        });

        if (!airport) {
          airport = new Airport();
          airport.icao_code = row.icao_code;
          airport.iata_code = row.iata_code;
          airport.name = row.name;
          airport.type = row.type || 'unknown';
          airport.latitude_deg = row.latitude_deg || 0;
          airport.longitude_deg = row.longitude_deg || 0;
          airport.elevation_ft = row.elevation_ft || 0;
          airport.city = city;
          await queryRunner.manager.save(airport);
          console.log(`Created new airport: ${airport.name} (${airport.iata_code})`);
        }
      }

      // Commit the transaction
      await queryRunner.commitTransaction();
      console.log('✅ Successfully imported airport data from Excel');
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      console.error('❌ Error while importing data:', error);
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Failed to import data from Excel:', error);
    throw error;
  }
}