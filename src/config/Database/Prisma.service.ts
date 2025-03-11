import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['query', 'info', 'warn'],
      errorFormat: 'pretty',
    })
  }

  async onModuleInit() {
    await this.$connect()
    console.log('Prisma service initialized and connected to the database.')
  }
}
