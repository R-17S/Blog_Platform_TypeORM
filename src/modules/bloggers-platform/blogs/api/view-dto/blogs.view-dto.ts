import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { BlogEntity } from '../../domain/blog.entity';

export class BlogViewModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;

  static mapToView(blog: BlogEntity): BlogViewModel {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }
}

export class BlogsViewPaginated extends PaginatedViewDto<BlogViewModel[]> {
  //items: BlogViewModel[];
}
