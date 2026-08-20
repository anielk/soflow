import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWorkspaceDto } from './create-workspace.dto';

describe('CreateWorkspaceDto', () => {
  it('accepts a valid name', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, { name: 'Acme Agency' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a blank name (invalid case)', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, { name: '' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects a name shorter than the minimum (invalid case)', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, { name: 'A' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects a non-string name (invalid case)', async () => {
    const dto = plainToInstance(CreateWorkspaceDto, { name: 12345 });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
