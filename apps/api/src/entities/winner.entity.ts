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

  @Column('varchar')
  walletAddress: string;

  @Column('int')
  position: number;

  @Column('decimal', { precision: 20, scale: 2 })
  reward: number;

  @Column('boolean', { default: false })
  claimed: boolean;

  @CreateDateColumn()
  claimedAt: Date;
}
