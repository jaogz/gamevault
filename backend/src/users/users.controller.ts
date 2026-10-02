import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.usersService.login(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('viewerId') viewerId?: string) {
    return this.usersService.findOne(+id, viewerId ? +viewerId : undefined);
  }

  @Post(':id/follow')
  follow(@Param('id') id: string, @Body('followerId') followerId: number) {
    return this.usersService.follow(+id, Number(followerId));
  }

  @Delete(':id/follow')
  unfollow(@Param('id') id: string, @Query('followerId') followerId: string) {
    return this.usersService.unfollow(+id, Number(followerId));
  }

  @Patch(':id')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(+id, dto);
  }
}
