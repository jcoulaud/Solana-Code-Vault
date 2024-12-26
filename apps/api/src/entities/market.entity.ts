import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class MarketData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal')
  marketCap: number;

  @Column('decimal')
  price: number;

  @CreateDateColumn()
  createdAt: Date;
}
