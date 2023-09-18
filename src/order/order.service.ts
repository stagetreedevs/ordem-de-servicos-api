import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderDto } from './dtos/order.dto';
import { Order, Prisma } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(order: OrderDto): Promise<Order> {
    return this.prisma.order.create({
      data: order,
    });
  }

  async getOrders(): Promise<OrderDto[]> {
    //name, model, brand, place, id, status

    return this.prisma.order.findMany();
  }

  async getDataByYear(year: number, data: Object[]) {
    const response = await this.prisma.order.findMany({
      where: {
        create_at: {
          gte: `${year}-01-01T00:00:00.000Z`,
          lt: `${year + 1}-01-01T00:00:00.000Z`,
        },
      },
    });

    const dataMes = []

    response.forEach(data => {
      const date = data.create_at

      const mounth = date.toLocaleString('default', { month: 'short' })

      // if(!dataMes[mounth]) {
      //   dataMes[mounth] = {
      //     valorTotal: 0,
      //     total: 0
      //   }
      // }

      const findMes = dataMes.findIndex((data) => data.name == mounth)

      if(findMes != -1){

        dataMes[findMes].totalService++
        dataMes[findMes].valorTotal += Number(data.total_payable)

        
      } else {

        dataMes.push({
          name: mounth,
          totalService: 1,
          valorTotal: Number(data.total_payable)
        })
        
      }

    }) 

    data.push(
      {
        year: year,
        dataMes
      }
    )

    return data
  }

  async getOrdersByYear() {
    let data = [];
    const years = [];

    const yearsR: Object[] = await this.prisma.$queryRaw(
      Prisma.sql`SELECT DISTINCT YEAR(create_at) as year
      FROM orders;`,
    );

    yearsR.map((year: { year: BigInt }) => {
      years.push(Number(year.year));
    });

    await Promise.all(years.map(async (year) => {

      const response = await this.getDataByYear(year, data)

      data = response

    }));

    return data
  }
}
