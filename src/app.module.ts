import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventModule } from './events/event.module'; 
import { UserModule } from './users/user.module'; 

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql', // Use the appropriate database type here.
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Password',
      database: 'nestjs_project',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // This pattern will look for all .ts and .js files that end with `.entity` in your project.
      synchronize: true, // Set this to false in production, it auto creates the DB tables on every application launch.
    }),
    EventModule, 
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
