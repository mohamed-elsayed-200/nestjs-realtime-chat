import { Prop, Schema } from '@nestjs/mongoose';
import { GroupSettings } from './group-settings';
import { ChannelSettings } from './channel-settings';
import { PrivateSettings } from './private-settings';
import { CommunitySettings } from './community-settings';

@Schema({ _id: false })
export class SpaceSettings {
  @Prop({ type: GroupSettings })
  group?: GroupSettings;

  @Prop({ type: ChannelSettings })
  channel?: ChannelSettings;

  @Prop({ type: PrivateSettings })
  private?: PrivateSettings;

  @Prop({ type: CommunitySettings })
  community?: CommunitySettings;
}
