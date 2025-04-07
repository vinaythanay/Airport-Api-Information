import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { City } from "./City";
import { Country } from "./Country";

@Entity()
export class Airport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  icao_code: string;

  @Column()
  iata_code: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column("float")
  latitude_deg: number;

  @Column("float")
  longitude_deg: number;

  @Column("float")
  elevation_ft: number;

  @Column()
  city_id: number;

  @ManyToOne(() => City, { nullable: true, eager: true })
  @JoinColumn()
  city: City;

  @ManyToOne(() => Country, { nullable: true, eager: true })
  @JoinColumn()
  country: Country;
}
