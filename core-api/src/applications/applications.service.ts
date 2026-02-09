import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createApplicationDto: CreateApplicationDto) {
    return this.prisma.application.create({
      data: {
        userId,
        ...createApplicationDto,
      },
      include: {
        scholarship: true,
        documents: true,
      },
    });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    
    return this.prisma.application.findMany({
      where,
      include: {
        scholarship: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        scholarship: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Check if user owns this application
    if (userId && application.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    return application;
  }

  async update(
    id: string,
    userId: string,
    updateApplicationDto: UpdateApplicationDto,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    if (application.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id },
      data: updateApplicationDto,
      include: {
        scholarship: true,
        documents: true,
      },
    });

    // Emit WebSocket notification if status changed
    if (
      updateApplicationDto.status &&
      updateApplicationDto.status !== application.status
    ) {
      this.notificationsService.notifyApplicationStatusUpdate(
        userId,
        id,
        updateApplicationDto.status,
        {
          scholarshipName: updatedApplication.scholarship?.name,
          previousStatus: application.status,
        },
      );
    }

    return updatedApplication;
  }

  async remove(id: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    if (application.userId !== userId) {
      throw new ForbiddenException('You do not have access to this application');
    }

    await this.prisma.application.delete({ where: { id } });

    return { message: 'Application deleted successfully' };
  }

  async getUserApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        scholarship: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
