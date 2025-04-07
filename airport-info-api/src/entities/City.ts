import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Country } from "./Country";
import { Airport } from "./Airport";

@Entity()
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  country_id: number;

  @Column()
  is_active: boolean;

  @Column("float")
  lat: number;

  @Column("float")
  long: number;

  @ManyToOne(() => Country)
  @JoinColumn({ name: "country_id" })
  country: Country;

  @OneToMany(() => Airport, airport => airport.city)
  airports: Airport[];
}
