// Common database interfaces
export interface QueryResult<T = any> {
    data: T | null;
    error: Error | null;
  }
  
  export interface DatabaseClient {
    from(table: string): QueryBuilder;
    auth: AuthClient;
    storage: StorageClient;
  }
  
  export interface QueryBuilder {
    select(columns?: string): Promise<QueryResult>;
    insert(data: any): Promise<QueryResult>;
    update(data: any): Promise<QueryResult>;
    delete(): Promise<QueryResult>;
    eq(column: string, value: any): QueryBuilder;
    order(column: string, options?: { ascending?: boolean }): QueryBuilder;
    limit(count: number): QueryBuilder;
  }
  
  export interface AuthClient {
    signUp(email: string, password: string): Promise<any>;
    signIn(email: string, password: string): Promise<any>;
    signOut(): Promise<any>;
    getUser(): Promise<any>;
    onAuthStateChange(callback: (event: string, session: any) => void): { unsubscribe: () => void };
  }
  
  export interface StorageClient {
    from(bucket: string): BucketClient;
  }
  
  export interface BucketClient {
    upload(path: string, file: File): Promise<any>;
    download(path: string): Promise<any>;
    remove(paths: string[]): Promise<any>;
    getPublicUrl(path: string): { data: { publicUrl: string } };
  }