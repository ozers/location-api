import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Area } from './area.entity';

@Entity('area_entity_logs')
export class AreaEntityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @Column({ name: 'area_id' })
  areaId!: string;

  @Column({ type: 'timestamp', name: 'entered_at' })
  enteredAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
