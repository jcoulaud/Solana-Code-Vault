import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('game_state')
export class GameState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 20, scale: 2 })
  currentMarketCap: number;

  @Column('int')
  revealedCharactersCount: number;

  @Column('json')
  revealedCharacters: string[];

  @Column('int')
  winnersCount: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
