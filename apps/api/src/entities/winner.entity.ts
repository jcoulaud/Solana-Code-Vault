import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('winners')
export class Winner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletAddress: string;

  @Column()
  position: number; // 1-100

  @Column('decimal', { precision: 10, scale: 2 })
  rewardPercentage: number;

  @Column('decimal', { precision: 20, scale: 0, default: 0 })
  tokenAmount: number;

  @CreateDateColumn()
  createdAt: Date;
}
