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

  @Column('decimal', { precision: 2, scale: 2 })
  rewardPercentage: number;

  @Column({ default: false })
  claimed: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
