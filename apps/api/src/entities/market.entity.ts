import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('market_data')
export class MarketData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 20, scale: 2 })
  marketCap: number;

  @Column('decimal', { precision: 20, scale: 8 })
  price: number;

  @CreateDateColumn()
  timestamp: Date;
}
