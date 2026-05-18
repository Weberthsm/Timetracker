import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksDispatcher } from './webhooks.dispatcher';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksDispatcher],
  exports: [WebhooksDispatcher],
})
export class WebhooksModule {}
