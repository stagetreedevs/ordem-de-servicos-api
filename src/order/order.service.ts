import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getDataByYear(year: number, data: {year: number, dataMes: any}[]) {
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

      const mounth = date.toLocaleString('pt-BR', { month: 'short' })

      const findMes = dataMes.findIndex((data) => data.name == mounth)

      if(findMes != -1){

        if(data.status == "paidout") {

          dataMes[findMes].valorTotalPago += Number(data.total_payable)
 
        } else {

          dataMes[findMes].valorTotalPendente += Number(data.total_payable)
          
        }

        dataMes[findMes].totalService++
        dataMes[findMes].valorTotal += Number(data.total_payable)

        
      } else {

        let valorPago = 0
        let valorPendente = 0
        let valorTotal = 0

        if(data.status == "paidout") {

          valorPago += Number(data.total_payable)
          
        } else {
          valorPendente += Number(data.total_payable)
        }

        valorTotal += Number(data.total_payable)

        dataMes.push({
          name: mounth,
          totalService: 1,
          valorTotalPago: valorPago,
          valorTotalPendente: valorPendente,
          valorTotal: valorTotal
        })
        
      }

    }) 

    data.push(
      {
        year: year,
        dataMes
      }
    )

    var monthNames = {
      "jan.": 1,
      "fev.": 2,
      "mar.": 3,
      "abr.": 4,
      "mai.": 5,
      "jun.": 6,
      "jul.": 7,
      "ago.": 8,
      "set.": 9,
      "out.": 10,
      "nov.": 11,
      "dez.": 12
    };

    await Promise.all(data.map((dataYear: { year: number, dataMes: [] }) => {

      dataYear.dataMes.sort(function(a: {name: string}, b: {name: string}) {

        console.log([
          monthNames[a.name],
          monthNames[b.name]
        ])
        
        return monthNames[a.name] - monthNames[b.name];
      })
      
    }))

    return data
  }

  async getOrdersByYear() {

    try {

      let data = [];
    const years = [];

    const yearsR: Object[] = await this.prisma.$queryRaw(
      Prisma.sql`SELECT DISTINCT EXTRACT(YEAR FROM create_at) AS year
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
      
    } catch(error) {

      return error
      
    }
  }

  async getOrderById(id: string) {

    const response = await this.prisma.order.findFirst({
      where: {
        id
      }
    })

    if(!response) {

      return false
      
    }

    return response
    
  }

  async updateOrder(id: string, data: OrderDto) {

    const response = await this.getOrderById(id)

    if(!response) {

      return new NotFoundException()
      
    }

    return this.prisma.order.update({
      where: {
        id
      },
      data: data
    })

  }

  async deleteOrder(id: string) {

    const response = await this.getOrderById(id)

    if(!response) {

      return new NotFoundException()
      
    }

    return this.prisma.order.delete({
      where: {
        id
      }
    })
    
  }
}
