import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { City } from "./City";

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  country_code_two: string;

  @Column()
  country_code_three: string;

  @Column()
  mobile_code: number;

  @Column()
  continent_id: number;

  @OneToMany(() => City, city => city.country)
  cities: City[];
}
